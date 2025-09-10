import { execFile } from 'child_process';
import os from 'os';
import { promisify } from 'util';

const pexec = promisify(execFile);

// Parse lsof in machine-friendly mode (-F).
// We request fields: p (pid), c (command), P (protocol), n (name), u (user)
export async function scanListeningPorts() {
  try {
    const { stdout } = await pexec('lsof', ['-nP', '-iTCP', '-sTCP:LISTEN', '-F', 'pcPun'], {
      env: { ...process.env, LC_ALL: 'C', LANG: 'C' },
      timeout: 5000,
      maxBuffer: 10 * 1024 * 1024
    });
    const lines = stdout.split(/\n/);
    const out = [];
    let cur = { pid: null, command: null, proto: 'tcp', user: null };
    
    for (const line of lines) {
      if (!line) continue;
      const key = line[0];
      const val = line.slice(1);
      
      if (key === 'p') { // new process record
        cur = { pid: Number(val), command: null, proto: 'tcp', user: null };
      } else if (key === 'c') {
        cur.command = val;
      } else if (key === 'P') {
        cur.proto = val;
      } else if (key === 'u') {
        cur.user = val;
      } else if (key === 'n') {
        // Each 'n' line is a separate network connection for the current process
        // NAME looks like: 127.0.0.1:3000 or *:5173 or [::1]:3000 or [::]:3000
        const name = val.replace(/ \(LISTEN\)$/, '');
        if (cur.pid && name) {
          // Handle both IPv4 (127.0.0.1:3000) and IPv6 ([::1]:3000) formats
          const m = name.match(/:(\d+)$/) || name.match(/\]:(\d+)$/);
          if (m) {
            out.push({
              source: 'host',
              pid: Number(cur.pid),
              command: cur.command || '(unknown)',
              proto: (cur.proto || 'tcp').toLowerCase(),
              name: name,
              port: Number(m[1]),
              user: cur.user || os.userInfo().username
            });
          }
        }
      }
    }
    
    // Deduplicate ports that are listening on both IPv4 and IPv6
    // Keep only one entry per pid:port combination, preferring IPv4 for display
    const seen = new Set();
    const deduped = [];
    for (const item of out) {
      const key = `${item.pid}:${item.port}`;
      if (!seen.has(key)) {
        seen.add(key);
        deduped.push(item);
      }
    }
    
    return deduped;
  } catch (err) {
    // lsof not found or no permissions; return empty
    return [];
  }
}

// Detect docker published ports by parsing `docker ps` formatted output.
export async function scanDockerPublishedPorts() {
  try {
    const { stdout } = await pexec('docker', ['ps', '--format', '{{.ID}}|{{.Names}}|{{.Ports}}'], {
      env: process.env,
      timeout: 5000,
      maxBuffer: 10 * 1024 * 1024
    });
    const out = [];
    for (const line of stdout.split(/\n/)) {
      if (!line.trim()) continue;
      const [id, name, ports] = line.split('|');
      if (!ports) continue;
      // Example ports string: "0.0.0.0:8080->80/tcp, :::8080->80/tcp"
      for (const part of ports.split(',')) {
        const seg = part.trim();
        const m = seg.match(/(?:0\.0\.0\.0|\*|::):([0-9]+)->([0-9]+)\/(tcp|udp)/i);
        if (m) {
          const hostPort = Number(m[1]);
          const containerPort = Number(m[2]);
          const proto = (m[3] || 'tcp').toLowerCase();
          out.push({
            source: 'docker',
            pid: null, // we don't map to PID here
            command: `docker:${name}`,
            containerId: id,
            containerName: name,
            proto,
            name: `${name}:${containerPort}`,
            port: hostPort,
            user: null
          });
        }
      }
    }
    return out;
  } catch {
    return [];
  }
}

export async function termPid(pid) {
  try {
    process.kill(Number(pid), 'SIGTERM');
    return { ok: true };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

export async function killPid(pid) {
  try {
    process.kill(Number(pid), 'SIGKILL');
    return { ok: true };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}
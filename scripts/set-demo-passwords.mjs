import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseEnv } from "node:util";
import { createSupabaseAdminConnection } from "../server/supabase.js";

const DEMO_URL = "https://jskebfkmlajyffuslocv.supabase.co";
const UUID = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;

export async function getDemoPasswordTargets() {
  const [env, demo] = await Promise.all([
    readFile(new URL("../.env.local", import.meta.url), "utf8").then(parseEnv),
    readFile(new URL("../.env.demo.local", import.meta.url), "utf8").then(parseEnv),
  ]).catch(() => { throw new Error("The local demo configuration is missing."); });

  const {
    TCMS_DEMO_ID: demoId, TCMS_DEMO_UNIT: unit,
    TCMS_DEMO_MANAGEMENT_USER_ID: managerId, TCMS_DEMO_TENANT_USER_ID: tenantId,
    TCMS_MANAGEMENT_AUTH_EMAIL: managerEmail,
  } = demo;
  if (env.TCMS_SUPABASE_URL !== DEMO_URL || !UUID.test(demoId) ||
      !UUID.test(managerId) || !UUID.test(tenantId) || managerId === tenantId ||
      !/^[1-5]$/.test(unit) || !managerEmail) {
    throw new Error("The local demo configuration does not match tenant-complaint-dev.");
  }

  const { configured, request } = createSupabaseAdminConnection(env);
  if (!configured) throw new Error("The local development server key is missing.");
  const [managerResponse, tenantResponse, unitResponse] = await Promise.all([
    request(`/auth/v1/admin/users/${managerId}`),
    request(`/auth/v1/admin/users/${tenantId}`),
    request("/rest/v1/rpc/tenant_login_email", { body: { p_unit: Number(unit) } }),
  ]);
  if (!managerResponse.ok || !tenantResponse.ok || !unitResponse.ok) {
    throw new Error("Unable to verify the two demo accounts.");
  }
  const [manager, tenant, activeEmail] = await Promise.all([
    managerResponse.json(), tenantResponse.json(), unitResponse.json(),
  ]);
  if (manager.id !== managerId || manager.email !== managerEmail || manager.app_metadata?.tcms_demo !== demoId ||
      tenant.id !== tenantId || !activeEmail || tenant.email !== activeEmail) {
    throw new Error("The demo accounts or unit have changed. No passwords were updated.");
  }
  return { request, managerId, tenantId, unit };
}

function validPassword(value) {
  return [...value].length >= 6 && Buffer.byteLength(value, "utf8") <= 72;
}

export async function setDemoPasswords(targets, { management, tenant }) {
  if (!validPassword(management) || !validPassword(tenant)) {
    throw new Error("Use at least 6 characters and no more than 72 bytes for each password.");
  }
  for (const [name, id, password] of [
    ["management", targets.managerId, management],
    ["tenant", targets.tenantId, tenant],
  ]) {
    const response = await targets.request(`/auth/v1/admin/users/${id}`, {
      method: "PUT", body: { password },
    }).catch(() => null);
    if (!response?.ok) {
      const error = response && await response.json().catch(() => null);
      if ((error?.error_code ?? error?.code) === "same_password") continue;
      throw new Error(`Could not confirm the demo ${name} password update. Run this command again to finish.`);
    }
  }
}

function readHidden(label) {
  const terminal = process.stdin;
  return new Promise((resolveInput, reject) => {
    let input = "";
    const wasRaw = terminal.isRaw;
    process.stdout.write(label);
    terminal.setEncoding("utf8");
    terminal.setRawMode(true);
    terminal.resume();

    function finish(error) {
      terminal.off("data", onData);
      terminal.setRawMode(wasRaw);
      terminal.pause();
      process.stdout.write("\n");
      if (error) reject(error);
      else resolveInput(input.trim());
    }

    function onData(chunk) {
      for (const character of chunk) {
        if (character === "\x03" || character === "\x04") return finish(new Error("Password entry canceled."));
        if (character === "\r" || character === "\n") return finish();
        if (character === "\x7f" || character === "\b") {
          input = [...input].slice(0, -1).join("");
        } else if (character >= " ") {
          input += character;
        }
      }
    }
    terminal.on("data", onData);
  });
}

async function choosePassword(name) {
  const password = await readHidden(`New demo ${name} password: `);
  if (!validPassword(password)) throw new Error("Use at least 6 characters and no more than 72 bytes.");
  const again = await readHidden(`Confirm demo ${name} password: `);
  if (password !== again) throw new Error("The passwords do not match.");
  return password;
}

async function main() {
  if (!process.stdin.isTTY) throw new Error("Run this command in your own interactive terminal.");
  const targets = await getDemoPasswordTargets();
  console.log(`Setting passwords for the management demo and Unit ${targets.unit} in tenant-complaint-dev. Typing is hidden.`);
  const management = await choosePassword("management");
  const tenant = await choosePassword(`Unit ${targets.unit} tenant`);
  await setDemoPasswords(targets, { management, tenant });
  console.log("Both demo passwords were set in Supabase Auth.");
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}

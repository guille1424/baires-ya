import "dotenv/config";
import { initDb } from "./db";
import { UserModel } from "./models/user";
import bcrypt from "bcrypt";

async function seed() {
  await initDb();

  const adminUsername = "admin";
  const adminPassword = "0192837465";

  const existing = await UserModel.findOne({ username: adminUsername });

  if (existing) {
    console.log("Usuario admin ya existe");
    process.exit(0);
  }

  const hash = await bcrypt.hash(adminPassword, 10);
  await UserModel.create({
    username: adminUsername,
    passwordHash: hash,
  });

  console.log("✅ Usuario admin creado exitosamente");
  console.log("Username: admin");
  console.log("Password: 0192837465");

  process.exit(0);
}

seed().catch((err) => {
  console.error("Error al crear usuario admin:", err);
  process.exit(1);
});

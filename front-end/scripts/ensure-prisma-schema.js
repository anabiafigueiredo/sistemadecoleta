#!/usr/bin/env node
/**
 * Garante prisma/schema.prisma no front-end (symlink ou cópia do back-end).
 * Usado no build do Render quando o Root Directory é front-end.
 */
const fs = require("fs");
const path = require("path");

const frontPrismaDir = path.join(__dirname, "..", "prisma");
const frontSchema = path.join(frontPrismaDir, "schema.prisma");
const backSchema = path.join(
  __dirname,
  "..",
  "..",
  "back-end",
  "prisma",
  "schema.prisma",
);

fs.mkdirSync(frontPrismaDir, { recursive: true });

function existsReadable(p) {
  try {
    fs.accessSync(p, fs.constants.R_OK);
    return true;
  } catch {
    return false;
  }
}

if (existsReadable(frontSchema)) {
  console.log("[ensure-prisma-schema] OK:", frontSchema);
  process.exit(0);
}

if (!existsReadable(backSchema)) {
  console.error(
    "[ensure-prisma-schema] Não achei schema em",
    frontSchema,
    "nem",
    backSchema,
  );
  process.exit(1);
}

fs.copyFileSync(backSchema, frontSchema);
console.log("[ensure-prisma-schema] Copiado de back-end → front-end/prisma/");

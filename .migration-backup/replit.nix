# Extra system packages for the Replit environment. The Node toolchain and
# Postgres come from `modules` in .replit; Prisma's query engine needs OpenSSL
# present at runtime (matches binaryTargets = debian-openssl-3.0.x in schema.prisma).
{ pkgs }:
{
  deps = [
    pkgs.openssl
  ];
}

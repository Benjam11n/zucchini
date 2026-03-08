import { access, mkdir, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { Icns, IcnsImage } from "@fiahfy/icns";
import type { OSType } from "@fiahfy/icns";
import pngToIco from "png-to-ico";
import sharp from "sharp";

const rootDir = path.resolve(import.meta.dir, "..");
const mascotDir = path.join(rootDir, "public", "mascot");
const buildDir = path.join(rootDir, "build");
const iconSourceCandidates = [
  path.join(rootDir, "public", "mascot-icon.png"),
  path.join(rootDir, "public", "mascot-icon.jpeg"),
  path.join(mascotDir, "mascot-icon.png"),
  path.join(mascotDir, "mascot-icon.jpeg"),
] as const;
const runtimeIconSizes = [16, 24, 32, 48, 64, 128, 256] as const;
const icnsSizes = [
  { osType: "icp4" as OSType, size: 16 },
  { osType: "ic11" as OSType, size: 32 },
  { osType: "icp5" as OSType, size: 32 },
  { osType: "ic12" as OSType, size: 64 },
  { osType: "icp6" as OSType, size: 64 },
  { osType: "ic07" as OSType, size: 128 },
  { osType: "ic13" as OSType, size: 256 },
  { osType: "ic08" as OSType, size: 256 },
  { osType: "ic14" as OSType, size: 512 },
  { osType: "ic09" as OSType, size: 512 },
  { osType: "ic10" as OSType, size: 1024 },
];

async function createSquareBuffer(filePath: string): Promise<Buffer> {
  const image = sharp(filePath, { animated: false });
  const metadata = await image.metadata();

  if (!metadata.width || !metadata.height) {
    throw new Error(`Unable to read dimensions for ${path.basename(filePath)}`);
  }

  const size = Math.min(metadata.width, metadata.height);
  const left = Math.floor((metadata.width - size) / 2);
  const top = Math.floor((metadata.height - size) / 2);
  const squareBuffer = await image
    .extract({ height: size, left, top, width: size })
    .png()
    .toBuffer();

  return squareBuffer;
}

async function cropMascotSquare(filename: string): Promise<void> {
  const filePath = path.join(mascotDir, filename);
  const squareBuffer = await createSquareBuffer(filePath);

  await writeFile(filePath, squareBuffer);
}

async function resolveIconSourcePath(): Promise<string> {
  for (const candidate of iconSourceCandidates) {
    try {
      await access(candidate);
      return candidate;
    } catch {
      continue;
    }
  }

  throw new Error(
    "A mascot icon source is required at public/mascot-icon.(png|jpeg) or public/mascot/mascot-icon.(png|jpeg)"
  );
}

async function generateRuntimeIcons(sourceBuffer: Buffer): Promise<void> {
  await mkdir(buildDir, { recursive: true });

  const iconPng = await sharp(sourceBuffer)
    .resize(512, 512, { fit: "contain" })
    .png()
    .toBuffer();
  await writeFile(path.join(buildDir, "icon.png"), iconPng);

  const icoInputs = await Promise.all(
    runtimeIconSizes.map((size) =>
      sharp(sourceBuffer)
        .resize(size, size, { fit: "contain" })
        .png()
        .toBuffer()
    )
  );
  const icoBuffer = await pngToIco(icoInputs);
  await writeFile(path.join(buildDir, "icon.ico"), icoBuffer);

  const icns = new Icns();
  const icnsInputs = await Promise.all(
    icnsSizes.map(async ({ osType, size }) => {
      const pngBuffer = await sharp(sourceBuffer)
        .resize(size, size, { fit: "contain" })
        .png()
        .toBuffer();
      return IcnsImage.fromPNG(pngBuffer, osType);
    })
  );

  for (const image of icnsInputs) {
    icns.append(image);
  }

  await writeFile(path.join(buildDir, "icon.icns"), icns.data);
}

async function main(): Promise<void> {
  const mascotDirectoryEntries = await readdir(mascotDir);
  const mascotFiles = mascotDirectoryEntries
    .filter((filename) => filename.endsWith(".png"))
    .toSorted();

  for (const filename of mascotFiles) {
    await cropMascotSquare(filename);
  }

  const iconSourcePath = await resolveIconSourcePath();
  const iconBuffer = await createSquareBuffer(iconSourcePath);
  await generateRuntimeIcons(iconBuffer);
}

await main();

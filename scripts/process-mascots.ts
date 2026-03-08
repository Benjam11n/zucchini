import { mkdir, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { Icns, IcnsImage } from "@fiahfy/icns";
import type { OSType } from "@fiahfy/icns";
import pngToIco from "png-to-ico";
import sharp from "sharp";

const rootDir = path.resolve(import.meta.dir, "..");
const mascotDir = path.join(rootDir, "public", "mascot");
const buildDir = path.join(rootDir, "build");
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

async function cropMascotSquare(filename: string): Promise<Buffer> {
  const filePath = path.join(mascotDir, filename);
  const image = sharp(filePath, { animated: false });
  const metadata = await image.metadata();

  if (!metadata.width || !metadata.height) {
    throw new Error(`Unable to read dimensions for ${filename}`);
  }

  const size = Math.min(metadata.width, metadata.height);
  const left = Math.floor((metadata.width - size) / 2);
  const top = Math.floor((metadata.height - size) / 2);
  const squareBuffer = await image
    .extract({ height: size, left, top, width: size })
    .png()
    .toBuffer();

  await writeFile(filePath, squareBuffer);
  return squareBuffer;
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
  let baseBuffer: Buffer | null = null;

  for (const filename of mascotFiles) {
    const squareBuffer = await cropMascotSquare(filename);
    if (filename === "mascot-base.png") {
      baseBuffer = squareBuffer;
    }
  }

  if (!baseBuffer) {
    throw new Error("mascot-base.png is required to generate app icons");
  }

  await generateRuntimeIcons(baseBuffer);
}

await main();

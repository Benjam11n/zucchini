function resolveMascotAsset(filename: string): string {
  return new URL(`../../../../public/mascot/${filename}`, import.meta.url).href;
}

export const MASCOTS = {
  base: resolveMascotAsset("mascot-base.png"),
  celebrate: resolveMascotAsset("mascot-celebrate.png"),
  determined: resolveMascotAsset("mascot-determined.png"),
  flame: resolveMascotAsset("mascot-flame.png"),
  freeze: resolveMascotAsset("mascot-freeze.png"),
  icon: resolveMascotAsset("mascot-icon.jpeg"),
  loading: resolveMascotAsset("mascot-loading.png"),
  reminder: resolveMascotAsset("mascot-reminder.png"),
  sad: resolveMascotAsset("mascot-sad.png"),
  sleepy: resolveMascotAsset("mascot-sleepy.png"),
} as const;

import { releaseMetadata } from "./generated/release-metadata";

export const githubRepositoryUrl = "https://github.com/Benjam11n/zucchini";
export const latestReleaseUrl = releaseMetadata.releaseUrl;
export const macDownloadUrl =
  releaseMetadata.macDownloadUrl ?? releaseMetadata.releaseUrl;
export const latestVersionLabel = releaseMetadata.version
  ? `Latest ${releaseMetadata.version}`
  : "Latest release";

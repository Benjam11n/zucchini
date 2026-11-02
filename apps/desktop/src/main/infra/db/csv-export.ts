import fs from "node:fs";
import path from "node:path";

import type Database from "better-sqlite3";

import {
  quoteSqlIdentifier,
  runWithDatabaseError,
  ZUCCHINI_TABLE_NAMES,
} from "./database-transfer";
import type { TableInfoRow } from "./database-transfer";

const SPREADSHEET_FORMULA_PREFIX_PATTERN = /^[=+\-@\t\r]/u;

type CsvCellValue = bigint | Buffer | null | number | string;
type CsvRow = Record<string, CsvCellValue>;

function serializeCsvCell(value: CsvCellValue): string {
  if (value === null) {
    return "";
  }

  let text = Buffer.isBuffer(value) ? value.toString("base64") : String(value);

  if (
    typeof value === "string" &&
    SPREADSHEET_FORMULA_PREFIX_PATTERN.test(text)
  ) {
    text = `'${text}`;
  }

  if (!/[",\r\n]/u.test(text)) {
    return text;
  }

  return `"${text.replaceAll('"', '""')}"`;
}

function serializeCsvRow(values: CsvCellValue[]): string {
  return values.map(serializeCsvCell).join(",");
}

function buildContainedOutputPath(
  destinationPath: string,
  fileName: string
): string {
  const destinationDirectory = path.resolve(destinationPath);
  const outputPath = path.resolve(destinationDirectory, fileName);
  const relativeOutputPath = path.relative(destinationDirectory, outputPath);

  if (
    relativeOutputPath.startsWith("..") ||
    path.isAbsolute(relativeOutputPath)
  ) {
    throw new Error(`CSV output path escapes export directory: ${fileName}`);
  }

  return outputPath;
}

export function exportCsvData(
  database: Database.Database,
  destinationPath: string
): void {
  runWithDatabaseError("exportCsvData", () => {
    fs.mkdirSync(destinationPath, { recursive: true });

    const tableRows = database
      .prepare(
        "select name from sqlite_master where type = 'table' and name not like 'sqlite_%' order by name"
      )
      .all() as TableInfoRow[];

    const tableNames = new Set(tableRows.map((row) => row.name));

    for (const tableName of ZUCCHINI_TABLE_NAMES) {
      if (!tableNames.has(tableName)) {
        continue;
      }

      const columnRows = database
        .prepare(`pragma table_info(${quoteSqlIdentifier(tableName)})`)
        .all() as TableInfoRow[];
      const columnNames = columnRows.map((row) => row.name);
      const rows = database
        .prepare(`select * from ${quoteSqlIdentifier(tableName)}`)
        .all() as CsvRow[];
      const csvRows = [
        serializeCsvRow(columnNames),
        ...rows.map((row) =>
          serializeCsvRow(
            columnNames.map((columnName) => row[columnName] ?? null)
          )
        ),
      ];

      fs.writeFileSync(
        buildContainedOutputPath(destinationPath, `${tableName}.csv`),
        `${csvRows.join("\n")}\n`
      );
    }
  });
}

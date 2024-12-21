import { readFileSync } from 'fs';
import { Request, Response } from 'express';

const currentdir = process.cwd();
const csvFile = readFileSync(`${currentdir}/patreon/patronList.csv`, 'utf8');
const patrons = csvToJson(csvFile);

type Patron = {
  name: string;
  tier: number;
  lifetimePledge: string;
};

export default async function handlePatrons(req: Request, res: Response) {
  res.setHeader('Content-Type', 'application/json');
  console.log(patrons);
  res.json(patrons);
}

function csvToJson(csv: string) {
  const lines = csv.split('\n');

  const result: Record<string, string>[] = [];
  const headers = lines[0].split(',');

  for (let i = 1; i < lines.length; i++) {
    const obj: Record<string, string> = {};
    const currentline = lines[i].split(',');

    for (let j = 0; j < headers.length; j++) {
      obj[headers[j]] = currentline[j];
    }

    result.push(obj);
  }

  const trimmedResult = result
    .filter(patron => patron['Patron Status'] === 'Active patron')
    .map(patron => {
      return {
        name: patron.Name,
        tier: tierToName(patron['Pledge Amount']),
        lifetimePledge: patron['Lifetime Amount'],
      };
    })
    .filter(patron => patron.tier !== null) as Patron[];

  const resultObject: { [key: string]: Patron[] } = {};

  // map into tiers
  for (const patron of trimmedResult) {
    resultObject[patron.tier] = [...(resultObject[patron.tier] || []), patron];
  }

  // sort each tier by lifetime
  for (const tier of Object.keys(resultObject)) {
    resultObject[tier].sort(
      (a, b) => Number(b.lifetimePledge) - Number(a.lifetimePledge)
    );
  }

  // convert into array of arrays, sorted by tier, desc
  const sortedResult = Object.keys(resultObject)
    .sort((a, b) => Number(b) - Number(a))
    .map(tier => ({ tier: tier, patrons: resultObject[tier] }));

  return sortedResult;
}

function tierToName(tier: string): number | null {
  if (tier === '2.00') return 2;
  if (tier === '5.00') return 5;
  if (tier === '15.00') return 15;
  if (tier === '50.00') return 50;
  if (tier === '100.00') return 100;
  return null;
}

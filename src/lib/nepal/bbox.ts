import indexJson from "@/data/nepal/province-index.json";

export type BBox = [number, number, number, number];

const raw = indexJson.nepal.bbox;

/** Nepal extent, without the station directory. */
export const NEPAL_BBOX: BBox = [raw[0], raw[1], raw[2], raw[3]];

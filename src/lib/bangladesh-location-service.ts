import divisionsRaw from "bangladesh-geojson/divisions";
import districtsRaw from "bangladesh-geojson/districts";
import upazilasRaw from "bangladesh-geojson/upazilas";
import postcodesRaw from "bangladesh-geojson/postcodes";

export type NormalizedDivision = {
  id: string;
  name: string;
  bnName: string;
  lat: string;
  long: string;
};

export type NormalizedDistrict = {
  id: string;
  divisionId: string;
  name: string;
  bnName: string;
  lat: string;
  long: string;
};

export type NormalizedUpazila = {
  id: string;
  districtId: string;
  name: string;
  bnName: string;
};

export type NormalizedPostcode = {
  divisionId: string;
  districtId: string;
  upazila: string;
  postOffice: string;
  postCode: string;
};

export type BangladeshSearchResult = {
  type: "division" | "district" | "upazila" | "postcode";
  label: string;
  divisionId?: string;
  divisionName?: string;
  districtId?: string;
  districtName?: string;
  upazilaId?: string;
  upazilaName?: string;
  postOffice?: string;
  postCode?: string;
};

type RawDivision = { id: string; name: string; bn_name: string; lat: string; long: string };
type RawDistrict = { id: string; division_id: string; name: string; bn_name: string; lat: string; long: string };
type RawUpazila = { id: string; district_id: string; name: string; bn_name: string };
type RawPostcode = { division_id: string; district_id: string; upazila: string; postOffice: string; postCode: string };

const divisions = ((divisionsRaw as { divisions?: RawDivision[] }).divisions ?? []).map(normalizeDivision);
const districts = ((districtsRaw as { districts?: RawDistrict[] }).districts ?? []).map(normalizeDistrict);
const upazilas = ((upazilasRaw as { upazilas?: RawUpazila[] }).upazilas ?? []).map(normalizeUpazila);
const postcodes = ((postcodesRaw as { postcodes?: RawPostcode[] }).postcodes ?? []).map(normalizePostcode);

export function getDivisions() {
  return divisions;
}

export function getDistrictsByDivision(divisionId: string) {
  return districts.filter((district) => district.divisionId === divisionId);
}

export function getUpazilasByDistrict(districtId: string) {
  return upazilas.filter((upazila) => upazila.districtId === districtId);
}

export function getPostcodesByDistrict(districtId: string) {
  return postcodes.filter((postcode) => postcode.districtId === districtId);
}

export function searchBangladeshLocation(query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const matches = (value?: string) => Boolean(value?.toLowerCase().includes(q));
  const results: BangladeshSearchResult[] = [];

  for (const division of divisions) {
    if (matches(division.name) || matches(division.bnName)) {
      results.push({
        type: "division",
        label: `${division.name} division`,
        divisionId: division.id,
        divisionName: division.name
      });
    }
  }

  for (const district of districts) {
    if (matches(district.name) || matches(district.bnName)) {
      const division = divisions.find((item) => item.id === district.divisionId);
      results.push({
        type: "district",
        label: `${district.name}, ${division?.name ?? "Bangladesh"}`,
        divisionId: district.divisionId,
        divisionName: division?.name,
        districtId: district.id,
        districtName: district.name
      });
    }
  }

  for (const upazila of upazilas) {
    if (matches(upazila.name) || matches(upazila.bnName)) {
      const district = districts.find((item) => item.id === upazila.districtId);
      const division = district ? divisions.find((item) => item.id === district.divisionId) : undefined;
      results.push({
        type: "upazila",
        label: `${upazila.name}, ${district?.name ?? "Bangladesh"}`,
        divisionId: district?.divisionId,
        divisionName: division?.name,
        districtId: district?.id,
        districtName: district?.name,
        upazilaId: upazila.id,
        upazilaName: upazila.name
      });
    }
  }

  for (const postcode of postcodes) {
    if (matches(postcode.postOffice) || matches(postcode.upazila) || matches(postcode.postCode)) {
      const district = districts.find((item) => item.id === postcode.districtId);
      const division = divisions.find((item) => item.id === postcode.divisionId);
      const upazila = upazilas.find((item) => item.districtId === postcode.districtId && sameName(item.name, postcode.upazila));
      results.push({
        type: "postcode",
        label: `${postcode.postOffice} ${postcode.postCode}, ${postcode.upazila}`,
        divisionId: postcode.divisionId,
        divisionName: division?.name,
        districtId: postcode.districtId,
        districtName: district?.name,
        upazilaId: upazila?.id,
        upazilaName: postcode.upazila,
        postOffice: postcode.postOffice,
        postCode: postcode.postCode
      });
    }
  }

  return results.slice(0, 30);
}

export function getFullLocationHierarchy() {
  return divisions.map((division) => ({
    ...division,
    districts: getDistrictsByDivision(division.id).map((district) => ({
      ...district,
      upazilas: getUpazilasByDistrict(district.id)
    }))
  }));
}

export function getDatasetStats() {
  return {
    providerName: "bangladesh-geojson",
    providerType: "Local package/data",
    divisions: divisions.length,
    districts: districts.length,
    upazilas: upazilas.length,
    postcodes: postcodes.length,
    installed: true
  };
}

function normalizeDivision(row: RawDivision): NormalizedDivision {
  return { id: row.id, name: row.name, bnName: row.bn_name, lat: row.lat, long: row.long };
}

function normalizeDistrict(row: RawDistrict): NormalizedDistrict {
  return { id: row.id, divisionId: row.division_id, name: row.name, bnName: row.bn_name, lat: row.lat, long: row.long };
}

function normalizeUpazila(row: RawUpazila): NormalizedUpazila {
  return { id: row.id, districtId: row.district_id, name: row.name, bnName: row.bn_name };
}

function normalizePostcode(row: RawPostcode): NormalizedPostcode {
  return { divisionId: row.division_id, districtId: row.district_id, upazila: row.upazila, postOffice: row.postOffice, postCode: row.postCode };
}

function sameName(a: string, b: string) {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

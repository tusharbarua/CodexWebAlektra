declare module "bangladesh-geojson/divisions" {
  const value: { divisions: Array<{ id: string; name: string; bn_name: string; lat: string; long: string }> };
  export default value;
}

declare module "bangladesh-geojson/districts" {
  const value: { districts: Array<{ id: string; division_id: string; name: string; bn_name: string; lat: string; long: string }> };
  export default value;
}

declare module "bangladesh-geojson/upazilas" {
  const value: { upazilas: Array<{ id: string; district_id: string; name: string; bn_name: string }> };
  export default value;
}

declare module "bangladesh-geojson/postcodes" {
  const value: { postcodes: Array<{ division_id: string; district_id: string; upazila: string; postOffice: string; postCode: string }> };
  export default value;
}

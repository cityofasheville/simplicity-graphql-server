export default `
type Climate {
	geoid: String
	name: String
	totalhh: Int
	heat_score: Int
	cdc_score: Int
	avg_energy: Float
	sum_scores: Int
	holc: Int
	red_score: Int
	wfirescore: Int
	all_assets_all_threats_sum_score: Int
	all_assets_ncem_vr_percent: Float
	all_assets_ncem_vr_count: Int
	all_assets_wildfire_vr_percent: Float
	all_assets_wildfire_vr_count: Int
	all_assets_landslide_vr_percent: Float
	all_assets_landslide_vr_count: Int
	hvi_level: String
	tree_level: String
	tcc: Float
	svi: Float
	polygon: Polygon
}
`;

declare module "plotly.js-dist-min" {
  // Minimal ambient typing for the prebuilt bundle; consumers narrow at call sites.
  const Plotly: Record<string, unknown>
  export default Plotly
}

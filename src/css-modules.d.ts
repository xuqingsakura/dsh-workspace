/** CSS Modules class-map declaration for the tsdown CSS-inline virtual loader. */
declare module '*.module.css' {
  /** Local class name → hashed class name. */
  const classes: Record<string, string>
  export default classes
}

/** Plain CSS imports resolve to an empty string (tsdown inlines the stylesheet). */
declare module '*.css' {
  const stylesheet: ''
  export default stylesheet
}

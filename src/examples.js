export const EXAMPLES = {
  addition: `// Addition zweier Zahlen: x0 := x1 + x2
x0 := x1;

LOOP x2 DO
  x0 := x0 + 1
END`,
  multiplication: `// Multiplikation zweier Zahlen: x0 := x1 * x2
x0 := 0;

LOOP x2 DO
  LOOP x1 DO
    x0 := x0 + 1
  END
END`,
  exponentiation: `// Exponentiation zweier Zahlen: x0 := x1 ^ x2
// Initialisiere x0 := 1 (da x1^0 = 1)
x0 := 1;

LOOP x2 DO
  // Multipliziere das bisherige x0 mit x1
  x_temp := 0;
  LOOP x0 DO
    LOOP x1 DO
      x_temp := x_temp + 1
    END
  END;
  x0 := x_temp
END`,
  predecessor: `// Vorgänger (Predecessor) berechnen: x0 := x1 - 1
// Da LOOP keine direkte Dekrementierung hat,
// merken wir uns in jeder Runde den vorherigen Wert.
x0 := 0;
x_prev := 0;

LOOP x1 DO
  x0 := x_prev;
  x_prev := x_prev + 1
END`,
  conditional: `// Bedingte Zuweisung (IF-THEN):
// Wenn x1 > 0, dann x0 := x2, sonst x0 := 0.
x0 := 0;

LOOP x1 DO
  x0 := x2
END`
};

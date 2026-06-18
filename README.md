# LOOP Programm-Simulator

Ein webbasierter Simulator zur Ausführung und Analyse von **LOOP-Programmen** im Kontext der *Theoretischen Informatik*.

**[Live-Version (GitHub Pages)](https://jonashuberts.github.io/LOOP-Simulator/)**

---

## Funktionsumfang

- **Interaktiver Code-Editor**: Bietet Syntax-Highlighting (Kommentare, Keywords, Zuweisungen, Variablen, Zahlen), automatische Zeilennummerierung, Unterstützung für Tab-Einrückungen (`Tab` / `Shift+Tab`) und eine automatische Code-Formatierung.
- **Dynamische Variablen-Erkennung**: Scannt das Programm in Echtzeit nach genutzten Registern (`x1`, `x2`, ...) und generiert automatisch entsprechende Eingabefelder zur Definition der Anfangswerte.
- **Schritt-für-Schritt-Debugger**: Ermöglicht die zeilenweise Ausführung des Codes inklusive optischer Markierung der aktiven Zeile sowie einer vollständigen Historie aller Registeränderungen (Trace Log).
- **Standardkonforme Semantik**:
  - **Instruktions-Set**: Unterstützt Zuweisungen (`xi := xj + c`), Monus-Subtraktion (`xi := xj - c` mit Untergrenze `0`) und Sequenzen (`P1; P2`).
  - **Schleifen-Auswertung**: Entsprechend der theoretischen Definition wird die Anzahl der Schleifendurchläufe beim Eintritt in ein `LOOP`-Konstrukt festgesetzt. Nachträgliche Modifikationen des Schleifenregisters innerhalb des Schleifenkörpers haben keinen Einfluss auf die Iterationsanzahl.
- **Integrierte Lehrbeispiele**: Enthält vordefinierte Beispielprogramme für Grundrechenarten (Addition, Multiplikation, Exponentiation), den Dekrement-Operator (Predecessor) sowie bedingte Anweisungen.

---

## Projektstruktur

```text
├── index.html        # Benutzeroberfläche & Dokumentation
├── style.css         # Visuelle Gestaltung & Layout
└── src/
    ├── main.js       # Applikationssteuerung & Event-Handling
    ├── parser.js     # Lexikalische Analyse & Parser
    ├── interpreter.js# Generator-basierter Interpreter (LOOP-Semantik)
    ├── editor.js     # Editor-Hilfsfunktionen & Syntax-Highlighter
    └── examples.js   # Datenbasis der Beispielprogramme
```

---

## Lokale Ausführung

Das Projekt benötigt keine Build-Schritte. Aufgrund der Verwendung von ES6-Modulen muss die Ausführung jedoch über einen lokalen Webserver erfolgen:

```bash
# Start eines lokalen Webservers (z. B. mittels serve)
npx serve .
```

*Alternativ kann in Entwicklungsumgebungen wie VS Code die Erweiterung „Live Server“ verwendet werden.*

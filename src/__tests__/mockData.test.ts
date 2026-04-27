import { describe, it, expect } from "vitest";
import { mockEvents, bookmakers, sports } from "@/data/mockData";

describe("mockEvents", () => {
  it("contém eventos com estrutura válida", () => {
    mockEvents.forEach((event) => {
      expect(event.id).toBeTruthy();
      expect(event.sport).toBeTruthy();
      expect(event.league).toBeTruthy();
      expect(event.homeTeam).toBeTruthy();
      expect(event.awayTeam).toBeTruthy();
      expect(event.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(event.time).toMatch(/^\d{2}:\d{2}$/);
      expect(Array.isArray(event.odds)).toBe(true);
    });
  });

  it("cada evento tem ao menos 2 casas de apostas", () => {
    mockEvents.forEach((event) => {
      expect(event.odds.length).toBeGreaterThanOrEqual(2);
    });
  });

  it("todos os IDs são únicos", () => {
    const ids = mockEvents.map((e) => e.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it("odds têm home e away sempre positivos", () => {
    mockEvents.forEach((event) => {
      event.odds.forEach((odd) => {
        expect(odd.home).toBeGreaterThan(1);
        expect(odd.away).toBeGreaterThan(1);
        if (odd.draw !== undefined) {
          expect(odd.draw).toBeGreaterThan(1);
        }
      });
    });
  });
});

describe("bookmakers", () => {
  it("contém casas com estrutura válida", () => {
    bookmakers.forEach((bm) => {
      expect(bm.id).toBeTruthy();
      expect(bm.name).toBeTruthy();
      expect(bm.country).toBeTruthy();
      expect(bm.url).toMatch(/^https?:\/\//);
    });
  });

  it("todos os IDs são únicos", () => {
    const ids = bookmakers.map((b) => b.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });
});

describe("sports", () => {
  it("contém esportes com estrutura válida", () => {
    sports.forEach((sport) => {
      expect(sport.id).toBeTruthy();
      expect(sport.name).toBeTruthy();
      expect(sport.icon).toBeTruthy();
      expect(typeof sport.active).toBe("boolean");
    });
  });
});

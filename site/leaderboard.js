/**
 * Public leaderboard: sites on the instance ranked by appreciation in a
 * period, this week unless `?period=` in the address picks another. Reads
 * `./config.json` for the API base.
 */
(() => {
  /** What the empty board says for each period; the keys are the API's periods. */
  const EMPTY = {
    today: 'No appreciation yet today.',
    week: 'No appreciation yet this week.',
    month: 'No appreciation yet this month.',
    quarter: 'No appreciation yet this quarter.',
    year: 'No appreciation yet this year.',
    all: 'No appreciation has been recorded yet.',
  };
  const DEFAULT_PERIOD = 'week';

  /** The period in the address, or the default for a missing or unknown one. */
  function periodFromUrl() {
    const period = new URLSearchParams(location.search).get('period');
    return period !== null && Object.hasOwn(EMPTY, period) ? period : DEFAULT_PERIOD;
  }

  function trimSlash(url) {
    return url.replace(/\/+$/, '');
  }

  function setRepoLinks(config) {
    const repo = config.repoUrl || 'https://github.com/medhatdawoud/appreciate-button';
    for (const link of document.querySelectorAll('[data-repo-link]')) link.href = repo;
  }

  function cell(text, className) {
    const td = document.createElement('td');
    td.textContent = text;
    if (className) td.className = className;
    return td;
  }

  /** The URL if it is a plain http(s) address, else null. */
  function httpUrl(value) {
    if (typeof value !== 'string') return null;
    try {
      const url = new URL(value);
      return url.protocol === 'https:' || url.protocol === 'http:' ? url : null;
    } catch {
      return null;
    }
  }

  /**
   * The site name and, under it, the address of its most-clicked page, both
   * one link to that page. The URL comes from counters any allowed page can
   * create, so it is checked to be plain http(s) and marked as user-generated
   * rather than endorsed.
   */
  function siteCell(entry) {
    const td = document.createElement('td');
    const url = httpUrl(entry.url);
    if (url === null) {
      td.textContent = entry.siteName;
      return td;
    }
    const link = document.createElement('a');
    link.className = 'site-link';
    link.href = url.href;
    link.rel = 'nofollow ugc noopener noreferrer';
    link.target = '_blank';
    const name = document.createElement('span');
    name.textContent = entry.siteName;
    const page = document.createElement('span');
    page.className = 'site-page';
    page.textContent = entry.url.replace(/^https?:\/\//i, '');
    link.append(name, page);
    td.append(link);
    return td;
  }

  /** Presses the period's button, and says from which day it counts. */
  function showPeriod(period, since) {
    for (const button of document.querySelectorAll('[data-period]')) {
      button.setAttribute('aria-pressed', String(button.dataset.period === period));
    }
    const note = document.querySelector('[data-board-since]');
    note.hidden = since === null;
    if (since !== null) {
      const day = new Date(`${since}T00:00:00Z`).toLocaleDateString(undefined, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC',
      });
      note.textContent = `Counting from ${day} (UTC).`;
    }
    document.querySelector('[data-board-empty]').textContent = EMPTY[period];
  }

  function render(entries) {
    const table = document.querySelector('[data-board]');
    const body = document.querySelector('[data-board-body]');
    body.replaceChildren(
      ...entries.map((entry, index) => {
        const tr = document.createElement('tr');
        tr.dataset.siteId = entry.siteId;
        tr.append(
          cell(String(index + 1), 'rank'),
          siteCell(entry),
          cell(String(entry.buttonCount), 'num'),
          cell(entry.totalCount.toLocaleString(), 'num'),
        );
        return tr;
      }),
    );
    table.hidden = entries.length === 0;
    document.querySelector('[data-board-empty]').hidden = entries.length > 0;
  }

  /**
   * Offers the signed-in owner of a listed site a way to its settings. Only
   * where the page is served by the instance itself: the sign-in cookie is
   * that origin's, and a copy hosted elsewhere never sees it. Anyone else,
   * or anything going wrong, simply gets no links.
   */
  async function markOwnSites(api) {
    if (new URL(api).origin !== location.origin) return;
    let siteIds = [];
    try {
      const response = await fetch(`${api}/v1/leaderboard/mine`, {
        credentials: 'same-origin',
        cache: 'no-store',
      });
      if (response.ok) ({ siteIds } = await response.json());
    } catch {
      return;
    }
    for (const siteId of siteIds) {
      const row = document.querySelector(
        `[data-board-body] tr[data-site-id="${CSS.escape(siteId)}"]`,
      );
      if (!row) continue;
      const link = document.createElement('a');
      link.className = 'owner-link';
      link.href = `/dashboard#/sites/${encodeURIComponent(siteId)}`;
      link.textContent = 'Your site · Settings';
      row.children[1]?.append(link);
    }
  }

  /** Counts loads, so an answer that arrives after a newer request is dropped. */
  let latest = 0;

  async function load(api, period) {
    const request = (latest += 1);
    showPeriod(period, null);
    document.querySelector('[data-board-error]').hidden = true;
    try {
      const response = await fetch(`${api}/v1/leaderboard?period=${encodeURIComponent(period)}`, {
        cache: 'no-store',
      });
      if (!response.ok) throw new Error(`status ${response.status}`);
      const board = await response.json();
      if (request !== latest) return;
      showPeriod(board.period, board.since);
      render(board.sites);
      await markOwnSites(api);
    } catch {
      if (request !== latest) return;
      document.querySelector('[data-board]').hidden = true;
      document.querySelector('[data-board-empty]').hidden = true;
      document.querySelector('[data-board-error]').hidden = false;
    }
  }

  /**
   * Switching period loads it and records it in the address, without the
   * parameter for the default, so a view can be shared and Back returns to
   * the one before.
   */
  function wirePeriods(api) {
    for (const button of document.querySelectorAll('[data-period]')) {
      button.addEventListener('click', () => {
        const period = button.dataset.period;
        if (period === periodFromUrl()) return;
        const url = new URL(location.href);
        if (period === DEFAULT_PERIOD) url.searchParams.delete('period');
        else url.searchParams.set('period', period);
        history.pushState(null, '', url);
        load(api, period);
      });
    }
    window.addEventListener('popstate', () => load(api, periodFromUrl()));
  }

  async function main() {
    let config = {};
    try {
      const response = await fetch('./config.json', { cache: 'no-store' });
      if (response.ok) config = await response.json();
    } catch {
      config = {};
    }
    setRepoLinks(config);

    if (!config.apiUrl) {
      document.querySelector('[data-board-missing]').hidden = false;
      return;
    }

    const api = trimSlash(config.apiUrl);
    wirePeriods(api);
    await load(api, periodFromUrl());
  }

  main();
})();

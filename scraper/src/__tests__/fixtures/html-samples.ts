/**
 * Sample HTML fragments for testing page scraper
 */

export const sampleJobPageHtml = `
<!DOCTYPE html>
<html>
<body>
  <div class="l-vacancy">
    <h1 class="g-h2">Senior QA Engineer</h1>

    <div class="sh-info">
      <span class="salary">$2000–3000</span>
    </div>

    <div class="place-name">Kyiv, remote</div>

    <div class="b-typo vacancy-section">
      <p>We are looking for a talented QA Engineer...</p>
      <ul>
        <li>5+ years of experience</li>
        <li>Strong automation skills</li>
      </ul>
    </div>
  </div>

  <div class="b-compinfo">
    <div class="logo">
      <img src="/company-logos/tech-company.png" alt="Tech Company" />
    </div>
    <div class="l-n">
      <a href="/companies/tech-company/">Tech Company</a>
    </div>
  </div>
</body>
</html>
`;

export const sampleJobPageWithoutSalary = `
<!DOCTYPE html>
<html>
<body>
  <div class="l-vacancy">
    <h1 class="g-h2">Junior Developer</h1>
    <div class="place-name">Lviv</div>
    <div class="b-typo vacancy-section">
      <p>Great opportunity for beginners...</p>
    </div>
  </div>

  <div class="b-compinfo">
    <div class="l-n">
      <a href="/companies/startup-inc/">Startup Inc</a>
    </div>
  </div>
</body>
</html>
`;

export const sampleRssItem = {
  title: 'Senior QA Engineer — Tech Company',
  link: 'https://jobs.dou.ua/companies/tech-company/vacancies/123456/',
  pubDate: '2024-01-15T10:00:00Z',
  isoDate: '2024-01-15T10:00:00.000Z',
  content: '<p>Short description from RSS</p>',
  contentSnippet: 'Short description from RSS',
};


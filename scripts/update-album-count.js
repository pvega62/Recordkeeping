const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '..', 'index.html');

try {
    const content = fs.readFileSync(indexPath, 'utf8');

    // Extract #album-cards-row contents
    const rowMatch = content.match(/<div id="album-cards-row"[^>]*>([\s\S]*?)<\/div>\s*<!-- Spotify Playlist Accordion Widget -->/i);
    if (!rowMatch) {
        console.error('Error: Could not locate #album-cards-row in index.html');
        process.exit(1);
    }

    const rowContent = rowMatch[1];
    // Count every album card container
    const cardMatches = rowContent.match(/<div class="col-md-3 mb-4">/g) || [];
    const count = cardMatches.length;
    const label = count === 1 ? 'Album' : 'Albums';

    console.log(`Scanned index.html: Found ${count} album records.`);

    // Regex to update the album badge in index.html
    const badgeRegex = /<span class="album-count-badge" id="album-count-badge"[^>]*>[\s\S]*?<span id="album-count-text">[\s\S]*?<\/span>\s*<\/span>/i;
    const newBadgeHtml = `<span class="album-count-badge" id="album-count-badge" aria-label="Total records in collection"><span id="album-count-num">${count}</span> <span id="album-count-text">${label}</span></span>`;

    if (!badgeRegex.test(content)) {
        console.error('Error: Could not locate #album-count-badge in index.html');
        process.exit(1);
    }

    const updatedContent = content.replace(badgeRegex, newBadgeHtml);

    if (content !== updatedContent) {
        fs.writeFileSync(indexPath, updatedContent, 'utf8');
        console.log(`Success: Updated album count badge in index.html to "${count} ${label}".`);
    } else {
        console.log(`Badge in index.html is already up to date ("${count} ${label}").`);
    }

    // Synchronize sitemap.xml lastmod date
    const sitemapPath = path.join(__dirname, '..', 'sitemap.xml');
    if (fs.existsSync(sitemapPath)) {
        const today = new Date().toISOString().split('T')[0];
        const sitemapContent = fs.readFileSync(sitemapPath, 'utf8');
        const updatedSitemap = sitemapContent.replace(/<lastmod>[\d-]+<\/lastmod>/, `<lastmod>${today}</lastmod>`);
        if (sitemapContent !== updatedSitemap) {
            fs.writeFileSync(sitemapPath, updatedSitemap, 'utf8');
            console.log(`Success: Updated sitemap.xml <lastmod> to ${today}.`);
        }
    }
} catch (err) {
    console.error('Failed to update album count or sitemap:', err);
    process.exit(1);
}

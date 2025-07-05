export function renderHtml(): string {
  return `
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>サイトマップジェネレーター</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        
        .container {
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
            padding: 40px;
            max-width: 600px;
            width: 100%;
        }
        
        h1 {
            color: #333;
            text-align: center;
            margin-bottom: 30px;
            font-size: 2.5em;
            background: linear-gradient(45deg, #667eea, #764ba2);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        
        .form-group {
            margin-bottom: 25px;
        }
        
        label {
            display: block;
            margin-bottom: 8px;
            color: #555;
            font-weight: 600;
        }
        
        input[type="url"] {
            width: 100%;
            padding: 15px;
            border: 2px solid #e1e5e9;
            border-radius: 10px;
            font-size: 16px;
            transition: border-color 0.3s ease;
        }
        
        input[type="url"]:focus {
            outline: none;
            border-color: #667eea;
        }
        
        .submit-btn {
            width: 100%;
            padding: 15px;
            background: linear-gradient(45deg, #667eea, #764ba2);
            color: white;
            border: none;
            border-radius: 10px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        
        .submit-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
        }
        
        .submit-btn:disabled {
            background: #ccc;
            cursor: not-allowed;
            transform: none;
            box-shadow: none;
        }
        
        .loading {
            display: none;
            text-align: center;
            margin-top: 20px;
        }
        
        .loading.show {
            display: block;
        }
        
        .spinner {
            display: inline-block;
            width: 40px;
            height: 40px;
            border: 4px solid #f3f3f3;
            border-top: 4px solid #667eea;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .result {
            margin-top: 30px;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 10px;
            display: none;
        }
        
        .result.show {
            display: block;
        }
        
        .result h3 {
            color: #333;
            margin-bottom: 15px;
        }
        
        .sitemap-info {
            margin-bottom: 20px;
        }
        
        .sitemap-info p {
            margin-bottom: 8px;
            color: #555;
        }
        
        .download-btn {
            background: #28a745;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
            transition: background-color 0.3s ease;
        }
        
        .download-btn:hover {
            background: #218838;
        }
        
        .error {
            background: #f8d7da;
            color: #721c24;
            padding: 15px;
            border-radius: 10px;
            margin-top: 20px;
            display: none;
        }
        
        .error.show {
            display: block;
        }
        
        .pages-list {
            max-height: 300px;
            overflow-y: auto;
            border: 1px solid #e1e5e9;
            border-radius: 5px;
            padding: 10px;
            margin-top: 10px;
        }
        
        .pages-list ul {
            list-style: none;
        }
        
        .pages-list li {
            padding: 5px 0;
            border-bottom: 1px solid #eee;
        }
        
        .pages-list li:last-child {
            border-bottom: none;
        }
        
        .pages-list a {
            color: #667eea;
            text-decoration: none;
            word-break: break-all;
        }
        
        .pages-list a:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>サイトマップジェネレーター</h1>
        
        <form id="sitemap-form">
            <div class="form-group">
                <label for="url">WebサイトのURL</label>
                <input type="url" id="url" name="url" placeholder="https://example.com" required>
            </div>
            
            <button type="submit" class="submit-btn" id="submit-btn">
                サイトマップを生成
            </button>
        </form>
        
        <div class="loading" id="loading">
            <div class="spinner"></div>
            <p>サイトマップを生成中...</p>
        </div>
        
        <div class="error" id="error"></div>
        
        <div class="result" id="result">
            <h3>サイトマップが生成されました！</h3>
            <div class="sitemap-info" id="sitemap-info"></div>
            <div class="pages-list" id="pages-list"></div>
            <button class="download-btn" id="download-btn">
                sitemap.xmlをダウンロード
            </button>
        </div>
    </div>

    <script>
        let currentSitemapXml = '';
        
        document.getElementById('sitemap-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const url = document.getElementById('url').value;
            const submitBtn = document.getElementById('submit-btn');
            const loading = document.getElementById('loading');
            const result = document.getElementById('result');
            const error = document.getElementById('error');
            
            // Reset states
            loading.classList.remove('show');
            result.classList.remove('show');
            error.classList.remove('show');
            
            submitBtn.disabled = true;
            loading.classList.add('show');
            
            try {
                // Step 1: Crawl the website
                const crawlResponse = await fetch('/api/crawl', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        url: url,
                        maxDepth: 3,
                        maxPages: 100,
                    }),
                });
                
                if (!crawlResponse.ok) {
                    throw new Error(\`クロールに失敗しました: \${crawlResponse.status}\`);
                }
                
                const crawlResult = await crawlResponse.json();
                
                if (!crawlResult.success) {
                    throw new Error(crawlResult.error || 'クロールに失敗しました');
                }
                
                // Step 2: Generate sitemap XML
                const sitemapResponse = await fetch('/api/sitemap/generate', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        baseUrl: url,
                        pages: crawlResult.data.pages,
                        includeLastmod: true,
                        includeChangefreq: true,
                        includePriority: true,
                    }),
                });
                
                if (!sitemapResponse.ok) {
                    throw new Error(\`サイトマップ生成に失敗しました: \${sitemapResponse.status}\`);
                }
                
                const sitemapResult = await sitemapResponse.json();
                
                if (!sitemapResult.success) {
                    throw new Error(sitemapResult.error || 'サイトマップ生成に失敗しました');
                }
                
                // Display results
                currentSitemapXml = sitemapResult.data.xml;
                displayResults(sitemapResult.data, crawlResult.data.pages);
                
            } catch (err) {
                console.error('Error:', err);
                error.textContent = err.message;
                error.classList.add('show');
            } finally {
                loading.classList.remove('show');
                submitBtn.disabled = false;
            }
        });
        
        function displayResults(sitemapData, pages) {
            const sitemapInfo = document.getElementById('sitemap-info');
            const pagesList = document.getElementById('pages-list');
            const result = document.getElementById('result');
            
            sitemapInfo.innerHTML = \`
                <p><strong>生成されたページ数:</strong> \${sitemapData.pageCount}</p>
                <p><strong>生成日時:</strong> \${new Date(sitemapData.generatedAt).toLocaleString('ja-JP')}</p>
            \`;
            
            const pagesHtml = pages.map(page => 
                \`<li><a href="\${page.url}" target="_blank">\${page.title || page.url}</a></li>\`
            ).join('');
            
            pagesList.innerHTML = \`
                <h4>発見されたページ一覧</h4>
                <ul>\${pagesHtml}</ul>
            \`;
            
            result.classList.add('show');
        }
        
        document.getElementById('download-btn').addEventListener('click', () => {
            if (currentSitemapXml) {
                const blob = new Blob([currentSitemapXml], { type: 'application/xml' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'sitemap.xml';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }
        });
    </script>
</body>
</html>
  `;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  // ====== SETTING REPO ANDA ======
  const GH_OWNER  = 'jejakalembab-cmd';   // contoh: "jejakalembab-cmd"
  const GH_REPO   = 'SHOPPING-PKB-APP';         // contoh: "SHOPPING-PKB-APP"
  const GH_BRANCH = 'main';
  const FILE_PATH = 'products.json';
  // ================================

  // Token rahsia disimpan di Vercel → Settings → Environment Variables → GH_TOKEN
  const token = process.env.GH_TOKEN;
  if (!token) {
    return res.status(500).json({ success:false, message:'GH_TOKEN not set in environment' });
  }

  try {
    // 1) dapatkan SHA fail semasa
    const getFile = await fetch(
      `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${FILE_PATH}?ref=${GH_BRANCH}`,
      { headers: { Authorization: `token ${token}` } }
    );
    if (!getFile.ok) {
      const t = await getFile.text();
      return res.status(500).json({ success:false, message:`Fail tak jumpa atau tiada akses: ${t}` });
    }
    const fileJson = await getFile.json();

    // 2) encode content baharu
    const body = req.body; // array objek products
    const contentString = JSON.stringify(body, null, 2);
    const contentEncoded = Buffer.from(contentString).toString('base64');

    // 3) commit ke GitHub
    const commitRes = await fetch(
      `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${FILE_PATH}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `token ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: 'Update products.json via PKB Admin',
          content: contentEncoded,
          sha: fileJson.sha,
          branch: GH_BRANCH
        })
      }
    );

    if (!commitRes.ok) {
      const errText = await commitRes.text();
      return res.status(500).json({ success:false, message: errText });
    }

    return res.json({ success:true });
  } catch (e) {
    return res.status(500).json({ success:false, message: e.message });
  }
                                   }

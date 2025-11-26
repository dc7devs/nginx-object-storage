export class MediaClient {
  constructor(baseURL) {
    this.baseURL = baseURL;
    this.token = null; // (1h)
  }

  async login(username, password) {
    const res = await fetch(`${this.baseURL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (!res.ok) {
      throw new Error("Login falhou: " + res.status);
    }

    const data = await res.json();
    this.token = data.token;
    return data.token;
  }

  async sign(path) {
    if (!this.token) throw new Error("Faça login primeiro");

    const res = await fetch(`${this.baseURL}/media/sign`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.token}`,
      },
      body: JSON.stringify({ path }),
    });

    if (!res.ok) {
      throw new Error("Erro ao gerar signed URL: " + res.status);
    }

    const data = await res.json();
    return data.signed_url;
  }

  async getBlob(path) {
    const signedUrl = await this.sign(path);
    const res = await fetch(signedUrl);

    if (!res.ok) {
      throw new Error("Erro ao baixar: " + res.status);
    }

    return await res.blob();
  }

  async getStream(path) {
    const signedUrl = await this.sign(path);

    const res = await fetch(signedUrl);
    if (!res.ok) {
      throw new Error("Erro ao baixar stream: " + res.status);
    }

    return res.body;
  }

  async getSignedUrl(path) {
    return this.sign(path);
  }
}
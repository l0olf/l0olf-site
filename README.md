# L0olf

Site institucional da L0olf, com HTML, CSS e JavaScript. Inclui a identidade visual aprovada, parallax, animações de rolagem, fontes locais, logos em SVG e página de privacidade.

## Executar localmente

Com Node.js instalado, execute na raiz do repositório:

```sh
node site/serve.mjs
```

Abra http://127.0.0.1:4173/. Não há dependências para instalar.

## Publicar na Netlify

Importe este repositório na Netlify e selecione a branch `main`. O arquivo `netlify.toml` preenche as configurações:

| Campo | Valor |
| --- | --- |
| Base directory | Deixar em branco |
| Build command | `node site/prepare-netlify.mjs` |
| Publish directory | `site/netlify-publish` |

O script monta a pasta pública a partir dos arquivos aprovados em `site/dist`. Quando a Netlify fornece a variável `URL`, ele também gera canonical, `og:url`, sitemap e a referência do sitemap em `robots.txt`. Não depende de API, banco de dados ou segredos.

Para gerar o pacote localmente:

```sh
node site/prepare-netlify.mjs
```

Se já tiver um endereço público confirmado, passe a URL HTTPS como argumento para incluir os metadados de publicação. A imagem de compartilhamento é opcional: as tags de imagem só são incluídas quando `site/dist/assets/social-cover.png` existir.

## Arquivos principais

- `site/dist/index.html`: estrutura, conteúdo e contatos.
- `site/dist/brand.css`, `ember.css`, `intro.css`: apresentação atual.
- `site/dist/brand.js`, `intro.js`, `intro-field.js`: navegação e animações.
- `site/dist/assets/`: logos e fontes locais.
- `site/dist/privacidade/index.html`: política de privacidade.
- `site/create-logo.mjs`: fonte vetorial das versões principais da logo; não é etapa de build.

Capturas, referências, backups e arquivos ZIP permanecem locais. A preparação não publica o site: a hospedagem é ativada ao importar e publicar o projeto na sua conta Netlify.

As licenças das fontes e do Lenis estão junto aos respectivos arquivos em `assets/fonts` e `vendor`.

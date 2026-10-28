# Portfólio de sites — Studio Swim

Endereço: https://portfolio.estudioswim.com.br/

Cada projeto é publicado em `/<caminho>/`. O site principal e os e-mails do domínio usam registros separados.

## Publicar por clique

Dê dois cliques em `PUBLICAR-NO-PORTFOLIO.cmd`, ou arraste a pasta estática pronta sobre esse arquivo. Informe a pasta, o caminho e o nome quando solicitado. A pasta precisa conter `index.html`; use a saída pública `dist` ou `out`, sem arquivos internos.

O script copia o projeto, atualiza a galeria, faz commit e push e confere o endereço HTTPS e os arquivos publicados. Uma publicação só é anunciada como concluída após a conferência. Caminhos existentes exigem `--replace`, evitando sobrescrever outro projeto por engano.

O publicador também aplica o convite da SWIM ao chegar ao fim da página. O padrão visual fica em `templates/swim-overlay/`: botão para a página inicial do estúdio e link sublinhado para o WhatsApp oficial da SWIM. A aplicação preserva outros diálogos da página e evita duplicar o convite em atualizações.

## Linha de comando

```powershell
node --use-system-ca scripts/publicar.mjs --source "D:\caminho\dist" --slug nome-do-projeto --title "Nome do projeto" --cover assets/capa.webp --category "Saúde" --open
```

- `--dry-run`: valida sem alterar ou publicar.
- `--replace`: atualiza um caminho existente após revisão.
- `--no-wait`: envia sem aguardar; ainda não confirma a publicação.
- `--verify-only --slug nome-do-projeto`: confere uma publicação já enviada.
- `--timeout 300`: limite de espera, em segundos.

Os caminhos dos assets devem ser relativos ou usar a base `/<caminho>/`. Aplicações que precisam de backend não são executadas pelo GitHub Pages. Credenciais nunca devem estar nos arquivos públicos. Git e GitHub CLI devem estar disponíveis, com a conta `matheustb70-max` autenticada.

## DNS

Na Hostinger, o registro CNAME `portfolio` aponta para `matheustb70-max.github.io`, sem nome de repositório. O GitHub Pages deste repositório publica a branch `main`, pasta `/docs`, com domínio `portfolio.estudioswim.com.br`.

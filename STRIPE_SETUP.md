# Activer les dons en mode test

Le site est prêt à tester Stripe Checkout, à générer un PDF de confirmation sans valeur fiscale et à l'envoyer au donateur. Les secrets ci-dessous ne doivent jamais être ajoutés à GitHub.

1. Exécutez `supabase/migrations/002_donations.sql` dans le SQL Editor de Supabase.
2. Créez un compte Resend, une clé API et une adresse d'expédition vérifiée. La fonction ajoute automatiquement `st4ssx@gmail.com` en copie cachée.
3. Ajoutez les secrets Supabase suivants :

```text
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
RESEND_API_KEY=re_...
EMAIL_FROM=Les Jeunes Explorateurs <onboarding@resend.dev>
SITE_URL=https://marvinst4.github.io/site_web
```

4. Déployez les fonctions :

```bash
supabase functions deploy create-donation-checkout
supabase functions deploy stripe-webhook --no-verify-jwt
```

5. Dans Stripe (mode test), créez un webhook vers `https://czimtrfxphtzvcrzmphd.supabase.co/functions/v1/stripe-webhook`, sélectionnez `checkout.session.completed`, puis enregistrez le secret de webhook dans Supabase.

Testez avec `4242 4242 4242 4242`, une date future, un CVC à trois chiffres et n'importe quel code postal.

Avant d'utiliser les clés Stripe de production, attendez que l'association soit déclarée et vérifiée. Ne remplacez pas le document de test par un reçu fiscal sans avoir vérifié votre éligibilité.

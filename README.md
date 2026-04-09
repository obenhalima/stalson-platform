# 🌿 Stalson Platform

Plateforme de monitoring agricole pour les domaines Stalson — Maroc.

Built with **Next.js 14**, **Supabase**, **Tailwind CSS**, **Recharts**.

---

## 🚀 Setup (5 étapes)

### 1. Installer les dépendances
```bash
cd stalson-platform
npm install
```

### 2. Configurer Supabase
1. Créer un projet sur [app.supabase.com](https://app.supabase.com)
2. Aller dans **SQL Editor** et exécuter dans l'ordre :
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_rls_policies.sql`
   - `supabase/migrations/003_seed.sql`
3. Copier l'URL et la clé anon depuis **Settings → API**

### 3. Variables d'environnement
```bash
cp .env.example .env.local
# Remplir les valeurs dans .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
ANTHROPIC_API_KEY=sk-ant-...
```

### 4. Lancer en local
```bash
npm run dev
# → http://localhost:3000
```

### 5. Déployer sur Vercel
```bash
# Push sur GitHub d'abord
git init -b main
git add .
git commit -m "feat: initial Stalson Platform"
git remote add origin https://github.com/VOTRE_USERNAME/stalson-platform.git
git push -u origin main

# Ensuite sur vercel.com → New Project → importer le repo
# Ajouter les variables d'environnement dans Vercel Dashboard
```

---

## 📁 Structure

```
stalson-platform/
├── app/
│   ├── (auth)/login/          # Page de connexion
│   ├── (app)/
│   │   ├── dashboard/         # Tableau de bord principal
│   │   ├── operations/        # Journal des opérations (mobile-first)
│   │   ├── budget/            # Budget vs Réel
│   │   ├── alerts/            # Alertes & anomalies
│   │   └── settings/          # Paramètres
│   └── api/
│       ├── anomaly/           # Détection d'anomalies (z-score)
│       ├── variance/          # Explication IA (Claude API)
│       └── alerts/dismiss/    # Ignorer une alerte
├── components/
│   ├── layout/                # Sidebar, MobileNav
│   ├── dashboard/             # KPICard, RevenueChart, CostBreakdown
│   ├── operations/            # OperationForm (offline-ready)
│   ├── budget/                # BudgetWizard (3 étapes)
│   └── alerts/                # AlertCard
├── lib/
│   ├── supabase/              # Client, server, types
│   ├── anomaly.ts             # Détection statistique (z-score)
│   └── formatters.ts          # Formatage MAD, dates FR
├── supabase/migrations/       # Schéma SQL complet
└── public/
    ├── manifest.json           # PWA manifest
    └── sw.js                   # Service worker (offline)
```

---

## 👥 Rôles utilisateurs

| Rôle | Accès |
|------|-------|
| `owner` | Tableau de bord global, alertes, paramètres |
| `farm_manager` | Saisie des opérations quotidiennes (mobile) |
| `finance` | Budget, rapports financiers |

---

## 🤖 Fonctionnalités IA

- **Détection d'anomalies** : z-score sur chaque ligne budgétaire vs historique
- **Zéro obligatoire bloqué** : engrais, phytos, énergie ne peuvent pas être à 0 sans justification
- **Explication des écarts** : Claude API génère une analyse en français des variances budget/réel
- **Mode hors ligne** : les opérations sont mises en file d'attente et synchronisées à la reconnexion

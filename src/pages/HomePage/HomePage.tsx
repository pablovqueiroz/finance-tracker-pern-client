import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import styles from "./HomePage.module.css";
import ThemeToggle from "../../components/ThemeToggle/ThemeToggle";
import LanguageSwitcher from "../../components/LanguageSwitcher/LanguageSwitcher";
import { useAuth } from "../../hooks/useAuth";

function HomePage() {
  const { isLoggedIn } = useAuth();
  const { t } = useTranslation();
  const featureItems = [
    {
      icon: "💸",
      title: t("home.features.tracking.title"),
      description: t("home.features.tracking.subtitle"),
    },
    {
      icon: "🗂️",
      title: t("home.features.categories.title"),
      description: t("home.features.categories.subtitle"),
    },
    {
      icon: "💳",
      title: t("home.features.balances.title"),
      description: t("home.features.balances.subtitle"),
    },
    {
      icon: "📊",
      title: t("home.features.charts.title"),
      description: t("home.features.charts.subtitle"),
    },
    {
      icon: "🎯",
      title: t("home.features.goals.title"),
      description: t("home.features.goals.subtitle"),
    },
  ];
  const steps = [
    {
      number: "01",
      title: t("home.howItWorks.step1.title"),
      description: t("home.howItWorks.step1.subtitle"),
    },
    {
      number: "02",
      title: t("home.howItWorks.step2.title"),
      description: t("home.howItWorks.step2.subtitle"),
    },
    {
      number: "03",
      title: t("home.howItWorks.step3.title"),
      description: t("home.howItWorks.step3.subtitle"),
    },
    {
      number: "04",
      title: t("home.howItWorks.step4.title"),
      description: t("home.howItWorks.step4.subtitle"),
    },
  ];
  const benefits = [
    t("home.benefits.control"),
    t("home.benefits.clarity"),
    t("home.benefits.planning"),
    t("home.benefits.confidence"),
  ];

  return (
    <div className={styles.page}>
      {!isLoggedIn ? (
        <nav className={styles.utilityControls}>
          {!isLoggedIn ? (
            <div className={styles.utilityActions}>
              <Link to="/register" className={styles.primaryBtn}>
                {t("home.primaryAction")}
              </Link>
              <Link to="/login" className={styles.secondaryBtn}>
                {t("home.secondaryAction")}
              </Link>
            </div>
          ) : null}
          <LanguageSwitcher />
          <ThemeToggle className={styles.utilityThemeToggle} />
        </nav>
      ) : null}

      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <span className={styles.eyebrow}>{t("home.eyebrow")}</span>
          <h1>{t("home.title")}</h1>
          <p className={styles.subtitle}>{t("home.subtitle")}</p>
          <p className={styles.description}>{t("home.description")}</p>

          {!isLoggedIn ? (
            <div className={styles.actions}>
              <Link to="/register" className={styles.primaryBtn}>
                {t("home.primaryAction")}
              </Link>
              <Link to="/login" className={styles.secondaryBtn}>
                {t("home.secondaryAction")}
              </Link>
            </div>
          ) : null}
        </div>

        <div className={styles.heroHighlights}>
          <article className={styles.highlightCard}>
            <span className={styles.highlightLabel}>
              {t("home.highlights.accounts.label")}
            </span>
            <strong>{t("home.highlights.accounts.value")}</strong>
            <p>{t("home.highlights.accounts.copy")}</p>
          </article>

          <article className={styles.highlightCard}>
            <span className={styles.highlightLabel}>
              {t("home.highlights.insights.label")}
            </span>
            <strong>{t("home.highlights.insights.value")}</strong>
            <p>{t("home.highlights.insights.copy")}</p>
          </article>

          <article className={styles.highlightCard}>
            <span className={styles.highlightLabel}>
              {t("home.highlights.goals.label")}
            </span>
            <strong>{t("home.highlights.goals.value")}</strong>
            <p>{t("home.highlights.goals.copy")}</p>
          </article>
        </div>
      </section>

      <section className={styles.features}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionEyebrow}>
            {t("home.featuresIntro.eyebrow")}
          </span>
          <h2>{t("home.featuresIntro.title")}</h2>
          <p>{t("home.featuresIntro.subtitle")}</p>
        </div>

        <div className={styles.featureGrid}>
          {featureItems.map((feature) => (
            <article key={feature.title} className={styles.card}>
              <span className={styles.cardIcon} aria-hidden="true">
                {feature.icon}
              </span>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.howItWorks}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionEyebrow}>
            {t("home.howItWorks.eyebrow")}
          </span>
          <h2>{t("home.howItWorks.title")}</h2>
          <p>{t("home.howItWorks.subtitle")}</p>
        </div>

        <div className={styles.stepsGrid}>
          {steps.map((step) => (
            <article key={step.number} className={styles.stepCard}>
              <span className={styles.stepNumber}>{step.number}</span>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.benefits}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionEyebrow}>
            {t("home.benefits.eyebrow")}
          </span>
          <h2>{t("home.benefits.title")}</h2>
          <p>{t("home.benefits.subtitle")}</p>
        </div>

        <div className={styles.benefitsGrid}>
          {benefits.map((benefit) => (
            <article key={benefit} className={styles.benefitCard}>
              <span className={styles.benefitMarker} aria-hidden="true">
                ✓
              </span>
              <p>{benefit}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

export default HomePage;

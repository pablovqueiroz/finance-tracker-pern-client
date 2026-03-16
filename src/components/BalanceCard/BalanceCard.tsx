import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
} from "react";
import { IoIosArrowDropleft, IoIosArrowDropright } from "react-icons/io";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { AccountSummary } from "../../types/account.types";
import { getLocale } from "../../i18n/getLocale";
import styles from "./BalanceCard.module.css";

type BalanceCardProps = {
  accounts: AccountSummary[];
  activeIndex: number;
  onPrev: () => void;
  onNext: () => void;
  onSelect: (index: number) => void;
};

function BalanceCard({
  accounts,
  activeIndex,
  onPrev,
  onNext,
  onSelect,
}: BalanceCardProps) {
  const { i18n, t } = useTranslation();
  const locale = getLocale(i18n.resolvedLanguage);
  const activeAccount = accounts[activeIndex] ?? null;
  const carouselRef = useRef<HTMLDivElement | null>(null);
  const slideRefs = useRef<Array<HTMLElement | null>>([]);
  const scrollTimeoutRef = useRef<number | null>(null);
  const dragStartXRef = useRef(0);
  const dragStartScrollLeftRef = useRef(0);
  const hasDraggedRef = useRef(false);
  const [isDragging, setIsDragging] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const activeSlide = slideRefs.current[activeIndex];
    if (!activeSlide) {
      return;
    }

    activeSlide.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [activeIndex, accounts.length]);

  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current !== null) {
        window.clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  const syncActiveIndexFromScroll = () => {
    const carousel = carouselRef.current;
    if (!carousel || accounts.length <= 1) {
      return;
    }

    const carouselRect = carousel.getBoundingClientRect();
    const carouselCenter = carouselRect.left + carouselRect.width / 2;
    let nextIndex = activeIndex;
    let closestDistance = Number.POSITIVE_INFINITY;

    slideRefs.current.forEach((slide, index) => {
      if (!slide) {
        return;
      }

      const slideRect = slide.getBoundingClientRect();
      const slideCenter = slideRect.left + slideRect.width / 2;
      const distance = Math.abs(slideCenter - carouselCenter);

      if (distance < closestDistance) {
        closestDistance = distance;
        nextIndex = index;
      }
    });

    if (nextIndex !== activeIndex) {
      onSelect(nextIndex);
    }
  };

  const handleScroll = () => {
    if (scrollTimeoutRef.current !== null) {
      window.clearTimeout(scrollTimeoutRef.current);
    }

    scrollTimeoutRef.current = window.setTimeout(
      syncActiveIndexFromScroll,
      100,
    );
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      onPrev();
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      onNext();
    }
  };

  const handleMouseDown = (event: MouseEvent<HTMLDivElement>) => {
    const carousel = carouselRef.current;
    if (!carousel || accounts.length <= 1 || event.button !== 0) {
      return;
    }

    dragStartXRef.current = event.clientX;
    dragStartScrollLeftRef.current = carousel.scrollLeft;
    hasDraggedRef.current = false;
    setIsDragging(true);
  };

  const handleMouseMove = (event: MouseEvent<HTMLDivElement>) => {
    const carousel = carouselRef.current;
    if (!carousel || !isDragging) {
      return;
    }

    const deltaX = event.clientX - dragStartXRef.current;
    if (Math.abs(deltaX) > 4) {
      hasDraggedRef.current = true;
    }

    carousel.scrollLeft = dragStartScrollLeftRef.current - deltaX;
    event.preventDefault();
  };

  const finishMouseDrag = () => {
    if (!isDragging) {
      return;
    }

    setIsDragging(false);
    if (hasDraggedRef.current) {
      handleScroll();
    }
  };

  if (!activeAccount) {
    return (
      <div className={styles.balanceCardContainer}>
        <p className={styles.emptyState}>{t("balanceCard.noAccounts")}</p>
      </div>
    );
  }

  return (
    <div className={styles.balanceCardContainer}>
      <section className={styles.header}>
        <small className={styles.counter}>
          {t("balanceCard.counter", {
            current: activeIndex + 1,
            total: accounts.length,
          })}
        </small>

        {accounts.length > 1 ? (
          <div className={styles.desktopControls}>
            <button
              type="button"
              className={styles.arrowButton}
              onClick={onPrev}
              aria-label={t("balanceCard.prev")}
              title={t("balanceCard.prev")}
            >
              <IoIosArrowDropleft />
            </button>
            <button
              type="button"
              className={styles.arrowButton}
              onClick={onNext}
              aria-label={t("balanceCard.next")}
              title={t("balanceCard.next")}
            >
              <IoIosArrowDropright />
            </button>
          </div>
        ) : null}
      </section>

      <div
        ref={carouselRef}
        className={`${styles.carousel} ${isDragging ? styles.carouselDragging : ""}`.trim()}
        onKeyDown={handleKeyDown}
        onScroll={handleScroll}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={finishMouseDrag}
        onMouseLeave={finishMouseDrag}
        tabIndex={accounts.length > 1 ? 0 : -1}
        aria-label={t("balanceCard.counter", {
          current: activeIndex + 1,
          total: accounts.length,
        })}
      >
        <div className={styles.track}>
          {accounts.map((account, index) => {
            const updatedAt = new Intl.DateTimeFormat(locale, {
              day: "2-digit",
              month: "short",
              year: "numeric",
            }).format(new Date(account.updatedAt));
            const numericBalance = Number(account.balance ?? 0);
            const formattedBalance = new Intl.NumberFormat(locale, {
              style: "currency",
              currency: account.currency,
            }).format(Number.isFinite(numericBalance) ? numericBalance : 0);
            const visibleMembers = (account.users ?? []).slice(0, 2);
            const remainingMembersCount = Math.max(
              (account.users ?? []).length - visibleMembers.length,
              0,
            );

            return (
              <article
                key={account.id}
                ref={(element) => {
                  slideRefs.current[index] = element;
                }}
                className={styles.slide}
                aria-hidden={index !== activeIndex}
              >
                <div
                  className={`${styles.slideCard} ${
                    index === activeIndex ? styles.slideCardActive : ""
                  }`}
                  role="link"
                  tabIndex={0}
                  onClick={() => navigate(`/accounts/${account.id}`)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      navigate(`/accounts/${account.id}`);
                    }
                  }}
                >
                  <section className={styles.accountData}>
                    <h3>{account.name}</h3>
                    <h3 className={styles.balancePill}>{formattedBalance}</h3>
                    <p>{account.description || t("common.noDescription")}</p>
                  </section>

                  <div className={styles.cardFooter}>
                    <section className={styles.meta}>
                      <span>
                        {t("balanceCard.updated", { date: updatedAt })}
                      </span>
                      <span>
                        {t("balanceCard.transactions", {
                          count: account._count?.transactions ?? 0,
                        })}
                      </span>
                    </section>
                  </div>

                  {visibleMembers.length > 0 ? (
                    <section className={styles.membersPreview}>
                      {visibleMembers.map((member) => (
                        <div className={styles.memberPreviewItem} key={member.userId}>
                          {member.user.image ? (
                            <img
                              className={styles.memberAvatar}
                              src={member.user.image}
                              alt={member.user.name}
                            />
                          ) : (
                            <span className={styles.memberAvatarFallback} aria-hidden="true">
                              {member.user.name.slice(0, 1).toUpperCase()}
                            </span>
                          )}
                          <span className={styles.memberPreviewText}>
                            <span className={styles.memberPreviewName}>
                              {member.user.name.trim().split(/\s+/)[0]}
                            </span>
                            <span className={styles.memberPreviewRole}>
                              {t(`roles.${member.role}`, {
                                defaultValue: member.role,
                              })}
                            </span>
                          </span>
                        </div>
                      ))}
                      {remainingMembersCount > 0 ? (
                        <span className={styles.membersMore}>
                          +{remainingMembersCount}
                        </span>
                      ) : null}
                    </section>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      </div>

      {accounts.length > 1 ? (
        <section className={styles.dots}>
          {accounts.map((account, index) => (
            <button
              key={account.id}
              type="button"
              onClick={() => onSelect(index)}
              className={`${styles.dot} ${index === activeIndex ? styles.dotActive : ""}`}
              aria-label={t("balanceCard.selectAccount", { index: index + 1 })}
            />
          ))}
        </section>
      ) : null}
    </div>
  );
}

export default BalanceCard;

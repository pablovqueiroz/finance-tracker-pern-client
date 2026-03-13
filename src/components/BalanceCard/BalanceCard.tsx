import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
} from "react";
import { FaRegEdit } from "react-icons/fa";
import { GiClick } from "react-icons/gi";
import { IoIosArrowDropleft, IoIosArrowDropright } from "react-icons/io";
import { Link } from "react-router-dom";
import { IoEnterOutline } from "react-icons/io5";
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
  const [openMembersAccountId, setOpenMembersAccountId] = useState<
    string | null
  >(null);

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

  useEffect(() => {
    if (!openMembersAccountId) return;

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenMembersAccountId(null);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [openMembersAccountId]);

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
                      <div className={styles.membersPopoverWrap}>
                        <button
                          className={styles.membersToggle}
                          type="button"
                          onClick={() =>
                            setOpenMembersAccountId((prev) =>
                              prev === account.id ? null : account.id,
                            )
                          }
                          aria-expanded={openMembersAccountId === account.id}
                        >
                          <GiClick className={styles.membersToggleIcon} aria-hidden="true" />
                          {t("balanceCard.seeMembers")}
                        </button>
                      </div>
                    </section>
                    <Link
                      className={styles.detailsLink}
                      to={`/accounts/${account.id}`}
                      aria-label={t("balanceCard.openDetails", {
                        name: account.name,
                      })}
                      title={t("balanceCard.openDetails", {
                        name: account.name,
                      })}
                    >
                      <IoEnterOutline aria-hidden="true" />
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      {openMembersAccountId ? (
        <div
          className={styles.membersModalOverlay}
          onClick={() => setOpenMembersAccountId(null)}
          role="presentation"
        >
          <div
            className={styles.membersModal}
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={t("common.members")}
          >
            <p className={styles.membersTitle}>{t("common.members")}</p>
            {(
              accounts.find((account) => account.id === openMembersAccountId)
                ?.users ?? []
            ).length > 0 ? (
              <div className={styles.membersList}>
                {(
                  accounts.find(
                    (account) => account.id === openMembersAccountId,
                  )?.users ?? []
                ).map((member) => (
                  <div className={styles.memberItem} key={member.userId}>
                    <span className={styles.memberLine}>
                      {member.user.name}:{" "}
                      {t(`roles.${member.role}`, {
                        defaultValue: member.role,
                      })}
                    </span>
                    <Link
                      className={styles.editMemberLink}
                      to={`/accounts/${openMembersAccountId}/members`}
                      aria-label={t("balanceCard.editMember", {
                        name: member.user.name,
                      })}
                      title={t("balanceCard.editMember", {
                        name: member.user.name,
                      })}
                      onClick={() => setOpenMembersAccountId(null)}
                    >
                      <FaRegEdit aria-hidden="true" />
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <p className={styles.membersEmpty}>{t("members.empty")}</p>
            )}
          </div>
        </div>
      ) : null}

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

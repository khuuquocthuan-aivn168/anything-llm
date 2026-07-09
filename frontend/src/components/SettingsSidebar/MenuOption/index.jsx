import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { safeJsonParse } from "@/utils/request";
import { isPathMatch } from "@/utils/paths";
import useScrollActiveItemIntoView from "@/hooks/useScrollActiveItemIntoView";
import { SidebarItem } from "@/components/GlassSidebar";

export default function MenuOption({
  btnText,
  icon,
  href,
  childOptions = [],
  flex = false,
  user = null,
  roles = [],
  hidden = false,
  isChild = false,
}) {
  const storageKey = generateStorageKey({ key: btnText });
  const location = useLocation();
  const hasChildren = childOptions.length > 0;
  const hasVisibleChildren = hasVisibleOptions(user, childOptions);
  const { isExpanded, setIsExpanded } = useIsExpanded({
    storageKey,
    hasVisibleChildren,
    childOptions,
    location: location.pathname,
  });

  const isActive = hasChildren
    ? (!isExpanded &&
        childOptions.some((child) =>
          isPathMatch(child.href, location.pathname)
        )) ||
      location.pathname === href
    : isPathMatch(href, location.pathname);

  const { ref } = useScrollActiveItemIntoView({
    isActive,
    behavior: "smooth",
    block: "nearest",
  });

  if (hidden) return null;

  if (!isChild) {
    if (!hasChildren) {
      if (!flex && !roles.includes(user?.role)) return null;
      if (flex && !!user && !roles.includes(user?.role)) return null;
    }
    if (hasChildren && !hasVisibleChildren) return null;
  } else {
    if (!flex && !roles.includes(user?.role)) return null;
    if (flex && !!user && !roles.includes(user?.role)) return null;
  }

  const handleToggle = () => {
    if (!hasChildren) return;
    const next = !isExpanded;
    setIsExpanded(next);
    localStorage.setItem(storageKey, JSON.stringify(next));
  };

  return (
    <div>
      <SidebarItem
        ref={ref}
        label={btnText}
        icon={icon}
        href={href}
        active={isActive}
        isChild={isChild}
        hasChildren={hasChildren}
        expanded={isExpanded}
        onToggle={handleToggle}
      />
      {isExpanded && hasChildren && (
        <div
          className="mt-1 flex flex-col gap-0.5 pl-1 animate-sidebar-slide"
          role="list"
        >
          {childOptions.map((childOption, index) => (
            <MenuOption
              key={index}
              {...childOption}
              user={user}
              isChild={true}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function useIsExpanded({
  storageKey = "",
  hasVisibleChildren = false,
  childOptions = [],
  location = null,
}) {
  const [isExpanded, setIsExpanded] = useState(() => {
    if (hasVisibleChildren) {
      const storedValue = localStorage.getItem(storageKey);
      if (storedValue !== null) {
        return safeJsonParse(storedValue, false);
      }
      return childOptions.some((child) => isPathMatch(child.href, location));
    }
    return false;
  });

  useEffect(() => {
    if (hasVisibleChildren) {
      const shouldExpand = childOptions.some((child) =>
        isPathMatch(child.href, location)
      );
      if (shouldExpand && !isExpanded) {
        setIsExpanded(true);
        localStorage.setItem(storageKey, JSON.stringify(true));
      }
    }
  }, [location]);

  return { isExpanded, setIsExpanded };
}

function hasVisibleOptions(user = null, childOptions = []) {
  if (!Array.isArray(childOptions) || childOptions?.length === 0) return false;

  function isVisible({
    roles = [],
    user = null,
    flex = false,
    hidden = false,
  }) {
    if (hidden) return false;
    if (!flex && !roles.includes(user?.role)) return false;
    if (flex && !!user && !roles.includes(user?.role)) return false;
    return true;
  }

  return childOptions.some((opt) =>
    isVisible({ roles: opt.roles, user, flex: opt.flex, hidden: opt.hidden })
  );
}

function generateStorageKey({ key = "" }) {
  const _key = key.replace(/\s+/g, "_").toLowerCase();
  return `anything_llm_menu_${_key}_expanded`;
}

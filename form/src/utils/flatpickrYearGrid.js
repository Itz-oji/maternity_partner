export function yearGridPlugin(opts = {}) {
  const cfg = {
    yearsPerPage: 12,          // 3x4 como tu boceto
    columns: 3,
    minYear: 1900,
    maxYear: new Date().getFullYear(),
    ...opts,
  };

  return (fp) => {
    let isOpen = false;
    let pageStartYear = null;

    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

    function getCurrentYear() {
      return fp.currentYear ?? new Date().getFullYear();
    }

    function setYear(y) {
      y = clamp(y, cfg.minYear, cfg.maxYear);
      fp.changeYear(y); // actualiza el calendario al año
      fp.redraw();
      updateYearBtn();
    }

    function updateYearBtn() {
      if (fp._yearBtn) fp._yearBtn.textContent = String(getCurrentYear());
    }

    function buildOverlay() {
      if (fp._yearOverlay) return;

      const overlay = document.createElement("div");
      overlay.className = "fp-yeargrid";
      overlay.hidden = true;

      // Header con flechas y botón de año (como tu boceto)
      const head = document.createElement("div");
      head.className = "fp-yeargrid__head";

      const prev = document.createElement("button");
      prev.type = "button";
      prev.className = "fp-yeargrid__nav";
      prev.textContent = "<";

      const title = document.createElement("button");
      title.type = "button";
      title.className = "fp-yeargrid__title";
      title.setAttribute("aria-label", "Cambiar año");

      const next = document.createElement("button");
      next.type = "button";
      next.className = "fp-yeargrid__nav";
      next.textContent = ">";

      head.append(prev, title, next);

      const grid = document.createElement("div");
      grid.className = "fp-yeargrid__grid";
      grid.style.gridTemplateColumns = `repeat(${cfg.columns}, 1fr)`;

      overlay.append(head, grid);

      // Guardamos refs
      fp._yearOverlay = overlay;
      fp._yearGrid = grid;
      fp._yearTitle = title;

      // Inserta dentro del calendar de flatpickr
      fp.calendarContainer.appendChild(overlay);

      // Eventos
      prev.addEventListener("click", () => {
        pageStartYear = clamp(pageStartYear - cfg.yearsPerPage, cfg.minYear, cfg.maxYear);
        renderYears();
      });

      next.addEventListener("click", () => {
        pageStartYear = clamp(pageStartYear + cfg.yearsPerPage, cfg.minYear, cfg.maxYear);
        renderYears();
      });

      // Si aprietan el título del overlay, cerrar overlay
      title.addEventListener("click", () => toggleOverlay(false));
    }

    function renderYears() {
      const y = getCurrentYear();

      if (pageStartYear == null) {
        // centra la página para incluir el año actual
        const offset = Math.floor(cfg.yearsPerPage / 2);
        pageStartYear = clamp(y - offset, cfg.minYear, cfg.maxYear - cfg.yearsPerPage + 1);
      }

      // Ajuste para no pasarse al final
      pageStartYear = clamp(pageStartYear, cfg.minYear, cfg.maxYear - cfg.yearsPerPage + 1);

      fp._yearTitle.textContent = `${pageStartYear} – ${Math.min(cfg.maxYear, pageStartYear + cfg.yearsPerPage - 1)}`;

      fp._yearGrid.innerHTML = "";

      for (let i = 0; i < cfg.yearsPerPage; i++) {
        const year = pageStartYear + i;
        if (year > cfg.maxYear) break;

        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "fp-yeargrid__year";
        btn.textContent = String(year);

        if (year === y) btn.classList.add("is-active");

        btn.addEventListener("click", () => {
          setYear(year);
          toggleOverlay(false); // volver a calendario
        });

        fp._yearGrid.appendChild(btn);
      }
    }

    function toggleOverlay(open) {
      buildOverlay();

      isOpen = open;

      fp._yearOverlay.hidden = !open;

      // Ocultamos la vista normal del calendario
      fp.daysContainer.style.display = open ? "none" : "";
      fp.monthNav.style.display = open ? "none" : "";

      if (open) renderYears();
      updateYearBtn();
    }

    function injectYearButton() {
        const nav = fp.monthNav;
        if (!nav) return;

        const curMonth = nav.querySelector(".flatpickr-current-month");
        if (!curMonth) return;

        // Flatpickr suele tener un input numérico .cur-year dentro
        const curYearInput = curMonth.querySelector(".cur-year");
        if (!curYearInput) return;

        // Si ya lo transformamos, no repetir
        if (fp._yearBtn) return;

        // Creamos botón y lo ponemos exactamente donde está el año
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "fp-yearbtn";
        btn.setAttribute("aria-label", "Elegir año");

        // Copiamos el valor actual
        btn.textContent = String(fp.currentYear);

        // Ocultamos el input nativo del año
        curYearInput.style.display = "none";

        // Insertamos el botón justo después del input del año
        curYearInput.insertAdjacentElement("afterend", btn);

        fp._yearBtn = btn;

        btn.addEventListener("click", () => toggleOverlay(!isOpen));
    }


    return {
      onReady() {
        injectYearButton();
        buildOverlay();
        updateYearBtn();
      },
      onYearChange() {
        updateYearBtn();
        if (isOpen) renderYears();
      },
      onMonthChange() {
        updateYearBtn();
      },
      onOpen() {
        // si abres el datepicker y estaba en modo años, lo dejamos como estaba
        updateYearBtn();
      },
      onClose() {
        // al cerrar, volvemos a normal para evitar rarezas
        if (isOpen) toggleOverlay(false);
      },
    };
  };
}

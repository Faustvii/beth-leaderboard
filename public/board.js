(function () {
  var OPPOSITE = { N: "S", S: "N", E: "W", W: "E" };
  var selected = null;
  var targetSeat = null;

  var phone = window.matchMedia("(max-width: 639px)");

  function form() {
    return document.getElementById("board-match-form");
  }

  function seats() {
    return Array.prototype.slice.call(document.querySelectorAll(".seat"));
  }

  function seatInput(seat) {
    return seat.querySelector('input[type="hidden"]');
  }

  function seatChip(seat) {
    return seat.querySelector(".chip");
  }

  function seatedChips() {
    return seats()
      .map(seatChip)
      .filter(function (c) {
        return c;
      });
  }

  function firstEmptySeat() {
    return seats().filter(function (s) {
      return !seatChip(s);
    })[0];
  }

  function showMessage(text) {
    var box = document.getElementById("tray-message");
    if (box) box.textContent = text;
  }

  function sit(chip, seat) {
    seat.querySelector(".seat-slot").appendChild(chip);
    chip.classList.add("chip-seated");
    seatInput(seat).value = chip.dataset.userId;
    seat.classList.add("seat-filled");
  }

  function vacate(seat) {
    seatInput(seat).value = "";
    seat.classList.remove("seat-filled");
  }

  function removeChip(chip) {
    var seat = chip.closest(".seat");
    if (seat) vacate(seat);
    chip.remove();
  }

  // Swap seat logic
  function moveTo(chip, seat) {
    var from = chip.closest(".seat");
    var other = seatChip(seat);
    if (from === seat) return;
    if (from) vacate(from);
    if (other) {
      vacate(seat);
      if (from) sit(other, from);
      else other.remove();
    }
    sit(chip, seat);
  }

  function select(chip) {
    deselect();
    selected = chip;
    chip.classList.add("chip-selected");
  }

  function deselect() {
    if (selected) selected.classList.remove("chip-selected");
    selected = null;
    clearTarget();
  }

  function setTarget(seat) {
    clearTarget();
    if (!seat) return;
    targetSeat = seat;
    seat.classList.add("seat-target");
    var f = form();
    var search = f && f.querySelector('input[name="name"]');
    if (!search) return;
    search.focus();
    // Instantly open dropdown
    var results = document.getElementById(f.id + "-search-results");
    if (results) results.removeAttribute("hidden");
    if (window.htmx && results) {
      window.htmx.ajax("GET", "/match/search?target=tray", {
        target: results,
        swap: "innerHTML",
        values: { name: search.value },
      });
    }
  }

  function clearTarget() {
    if (targetSeat) targetSeat.classList.remove("seat-target");
    targetSeat = null;
  }

  var TEAM_SEATS = { NS: ["N", "S"], EW: ["E", "W"] };
  // Highlight the winning team with a gold border
  function updateWinnerHighlight() {
    var f = form();
    if (!f) return;
    var winner = "";
    var checked = f.querySelector(
      ".winner-option input:checked:not(:disabled)",
    );
    var select = f.querySelector(".winner-select");
    if (checked) winner = checked.value;
    else if (select && !select.disabled) winner = select.value;
    var winning = TEAM_SEATS[winner] || (OPPOSITE[winner] ? [winner] : []);
    seats().forEach(function (seat) {
      seat.classList.toggle(
        "seat-winner",
        winning.indexOf(seat.dataset.seat) !== -1,
      );
    });
  }

  function newChip(userId, name) {
    var template = document.getElementById("chip-template");
    var chip = template.content.firstElementChild.cloneNode(true);
    chip.dataset.userId = userId;
    chip.dataset.name = name;
    var nameEl = chip.querySelector(".chip-name");
    nameEl.textContent = name;
    nameEl.title = name;
    return chip;
  }

  // 1v1 handling
  function updateMode() {
    var f = form();
    if (!f) return;
    var seated = seatedChips();
    var singles = seated.length === 2;
    var wasSingles = f.classList.contains("mode-singles");
    f.classList.toggle("mode-singles", singles);

    var options = f.querySelectorAll(".winner-option[data-team]");
    var select = f.querySelector(".winner-select");
    var isPhone = phone.matches;
    var adjacent = false;
    var white = null;
    var black = null;
    if (singles) {
      var a = seated[0].closest(".seat").dataset.seat;
      var b = seated[1].closest(".seat").dataset.seat;
      adjacent = OPPOSITE[a] !== b;
      // Use legacy black/white for 1v1
      white = a === "N" || a === "E" ? seated[0] : seated[1];
      black = white === seated[0] ? seated[1] : seated[0];
    }

    function sideState(team, el, labelEl) {
      if (!el.dataset.teamValue) {
        el.dataset.teamValue = el.value;
        el.dataset.teamLabel = labelEl.textContent;
      }
      if (singles) {
        var chip = team === "White" ? white : black;
        return {
          value: chip.closest(".seat").dataset.seat,
          label: chip.dataset.name,
        };
      }
      return { value: el.dataset.teamValue, label: el.dataset.teamLabel };
    }

    options.forEach(function (opt) {
      var radio = opt.querySelector("input");
      var label = opt.querySelector(".winner-label");
      var st = sideState(opt.dataset.team, radio, label);
      radio.value = st.value;
      label.textContent = st.label;
      radio.disabled = isPhone || adjacent;
    });
    f.querySelectorAll(".winner-option:not([data-team]) input").forEach(
      function (radio) {
        radio.disabled = isPhone;
      },
    );
    if (select) {
      select.querySelectorAll("option[data-team]").forEach(function (option) {
        var st = sideState(option.dataset.team, option, option);
        option.value = st.value;
        option.textContent = st.label;
        option.disabled = adjacent;
      });
      if (adjacent && select.value !== "Draw") select.value = "";
      select.disabled = !isPhone;
    }
    if (singles !== wasSingles) {
      options.forEach(function (opt) {
        opt.querySelector("input").checked = false;
      });
      if (select) select.value = "";
    }
    showMessage(adjacent ? "In a 1v1 the players sit opposite each other" : "");
    updateWinnerHighlight();
  }

  document.addEventListener("click", function (e) {
    var target = e.target;
    if (!target.closest) return;

    var add = target.closest(".tray-add");
    if (add) {
      e.preventDefault();
      add.parentElement.setAttribute("hidden", "");
      var search = add.closest("form").querySelector('input[name="name"]');
      if (search) search.value = "";
      var existing = document.querySelector(
        '.chip[data-user-id="' + add.dataset.userId + '"]',
      );
      var into = targetSeat || firstEmptySeat();
      if (!into) {
        deselect();
        showMessage("All four seats are taken — remove a player first");
        return;
      }
      if (existing) moveTo(existing, into);
      else sit(newChip(add.dataset.userId, add.dataset.name), into);
      deselect();
      updateMode();
      return;
    }

    var remove = target.closest(".chip-remove");
    if (remove) {
      e.preventDefault();
      removeChip(remove.closest(".chip"));
      deselect();
      updateMode();
      return;
    }

    var chip = target.closest(".chip");
    if (chip) {
      e.preventDefault();
      if (selected === chip) {
        deselect();
      } else if (selected) {
        moveTo(selected, chip.closest(".seat"));
        deselect();
        updateMode();
      } else {
        select(chip);
      }
      return;
    }

    var seat = target.closest(".seat");
    if (!seat) return;
    e.preventDefault();
    if (selected) {
      moveTo(selected, seat);
      deselect();
      updateMode();
    } else if (seatChip(seat)) {
      select(seatChip(seat));
    } else if (seat === targetSeat) {
      clearTarget();
    } else {
      setTarget(seat);
    }
  });

  document.addEventListener("change", function (e) {
    if (e.target.closest && e.target.closest('[name="winner"]')) {
      updateWinnerHighlight();
    }
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") deselect();
  });

  phone.addEventListener("change", updateMode);
  updateMode();

  document.addEventListener("htmx:afterSwap", function (e) {
    var swapped = e.detail && e.detail.target;
    if (swapped && swapped.classList.contains("search-results")) return;
    deselect();
    updateMode();
  });
})();

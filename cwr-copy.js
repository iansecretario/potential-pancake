$(document).ready(function () {
  function addClipboardFunctionality() {
    $("pre").each(function () {
      var $pre = $(this);

      if ($pre.hasClass("clip-processed")) return;
      $pre.addClass("clip-processed").css("position","relative");

      var $btn = $(`
        <button class="clipboard-button btn btn-secondary btn-sm"
                style="position:absolute;top:.5rem;right:1.5rem;z-index:10000;
                       color:skyblue;background:none;border:none;display:none;"
                title="Copy code">
          <i class="fa fa-clipboard" aria-hidden="true"></i>
        </button>
      `);

      $btn.on("click", function () {
        // Prefer an explicit raw source if you add one later: <pre data-raw="...">
        var raw = $pre.attr("data-raw");
        // Fallback to DOM textContent (NOT jQuery.text()), which preserves \n and spaces.
        var text = (raw != null ? raw : $pre[0].textContent).replace(/\r\n/g, "\n");

        // Don’t .trim() — it kills leading/trailing newlines/spaces.
        navigator.clipboard.writeText(text).then(function () {
          $btn.html('<i class="fa fa-check" aria-hidden="true"></i>');
          setTimeout(function () { $btn.html('<i class="fa fa-clipboard" aria-hidden="true"></i>'); }, 1500);
        }).catch(function () {
          // Fallback path if Clipboard API blocked
          var ta = document.createElement("textarea");
          ta.value = text;
          ta.style.position = "fixed"; ta.style.opacity = "0";
          document.body.appendChild(ta); ta.select();
          document.execCommand("copy");
          document.body.removeChild(ta);
          $btn.html('<i class="fa fa-check" aria-hidden="true"></i>');
          setTimeout(function () { $btn.html('<i class="fa fa-clipboard" aria-hidden="true"></i>'); }, 1500);
        });
      });

      $pre.append($btn).hover(
        function () { $btn.css("display","block"); },
        function () { $btn.css("display","none"); }
      );
    });
  }

  addClipboardFunctionality();

  // Re-apply when Thinkific swaps content
  if (typeof CoursePlayerV2 !== "undefined") {
    CoursePlayerV2.on("hooks:contentDidChange", function () {
      setTimeout(addClipboardFunctionality, 500);
    });
  }
});

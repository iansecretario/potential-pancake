<script>
// Helper: get exact code from a <pre>
function getPreRaw(preEl) {
  // Highest priority: explicit data-raw (lets you bypass any DOM munging)
  if (preEl.hasAttribute('data-raw')) return preEl.getAttribute('data-raw');

  // If author wrapped each line in <span>, rebuild with \n manually (ignores visual line numbers)
  const spans = preEl.querySelectorAll(':scope > span');
  if (spans.length) {
    return Array.from(spans).map(s => s.textContent).join('\n');
  }

  // Fallback: raw DOM text (NOT innerHTML, NOT jQuery.text()), normalize CRLF to LF
  return preEl.textContent.replace(/\r\n/g, '\n');
}

// Helper: write to clipboard with fallback
async function copyTextExactly(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text; ta.style.position='fixed'; ta.style.opacity='0';
    document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove();
    return true;
  }
}
</script>

<!-- jQuery-based auto "Copy" for all <pre> -->
<script>
// Requires jQuery on the page
$(document).ready(function () {
  function addClipboardFunctionality() {
    $("pre").each(function () {
      var $pre = $(this);
      if ($pre.hasClass("clip-processed")) return;

      $pre.addClass("clip-processed");

      var $btn = $('<button class="clipboard-button" title="Copy code"><i class="fa fa-clipboard" aria-hidden="true"></i></button>');

      $btn.on("click", async function () {
        const text = getPreRaw($pre[0]);
        await copyTextExactly(text);
        $btn.html('<i class="fa fa-check" aria-hidden="true"></i>');
        setTimeout(function(){ $btn.html('<i class="fa fa-clipboard" aria-hidden="true"></i>'); }, 1200);
      });

      $pre.append($btn).hover(
        function(){ $btn.css("display","block"); },
        function(){ $btn.css("display","none"); }
      );
    });
  }

  addClipboardFunctionality();

  // Re-apply when Thinkific swaps lesson content
  if (typeof CoursePlayerV2 !== "undefined") {
    CoursePlayerV2.on("hooks:contentDidChange", function () {
      setTimeout(addClipboardFunctionality, 500);
    });
  }
});
</script>

<!-- Plain JS copy button for the span-based demo block -->
<script>
document.getElementById("copy-btn").addEventListener("click", async () => {
  const pre = document.getElementById("code-block");
  const text = getPreRaw(pre);
  await copyTextExactly(text);
  alert("Copied with newlines preserved!");
});
</script>

interface SelectGetProps {
  id: string;
  config: unknown;
}

export const Chart = ({ id, config }: SelectGetProps) => (
  <>
    <canvas id={id} />
    {/* Inserting a <script> tag with innerHtml (used by HTMX in hx-get) does not execute the code, but using onload on a <style> tag will */}
    <style
      onload={`new Chart(document.getElementById("${id}"), ${JSON.stringify(
        config,
      )})`}
    ></style>
  </>
);

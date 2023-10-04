export function liveReloadScript({
  url = "ws://localhost:3001/ws",
}: {
  url?: string;
} = {}): string {
  return `
          (function () {
            let socket = new WebSocket(\"${url}\");
  
            socket.onopen = function(e) {
              console.log("connected")
            };

            socket.onmessage = function(event) {
              console.log("event", event.data)
              location.reload();
            };
  
            socket.onclose = function(event) {
              console.log("closed");
            };
  
            socket.onerror = function(error) {
              console.log("error: " + error.message);
            };
          })();
          `;
}

$(function () {
    /**
     * Updates the Copywrite year on document ready
     */
    $("#copyYear").text(new Date().getFullYear());

    /**
     * Copies provided text to the OS clipboard
     * @param {string} text
     */
    function updateClipboard(text) {
        navigator.clipboard.writeText(text);
        console.log(`Copied ${text} to clipboard`);
    }

    /**
     * Show modal when clicking reload services button
     */
    $("#reload").on("click", function () {
        content = $("#reload").data("message");
        $("#popupModalBody").text(content);
    });

    /**
     * On click of element with id "configData", updates clipboard with text in element with id "octoPrintHost"
     */
    $("#configData").on("click", function () {
        const value = $("#octoPrintHost").text();
        updateClipboard(value);
    });

    /**
     * On click of element with id "copyFilePath", updates clipboard with text in element with id "loginFilePath"
     */
    $("#copyFilePath").on("click", function () {
        const value = $("#loginFilePath").text();
        updateClipboard(value);
    });

    /**
     * Initializes bootstrap alerts and sets a timeout for when they should automatically close
     */
    let alert_list = document.querySelectorAll(".alert");
    alert_list.forEach(function (alert) {
        new bootstrap.Alert(alert);

        let alert_timeout = alert.getAttribute("data-timeout");
        setTimeout(() => {
            bootstrap.Alert.getInstance(alert).close();
        }, +alert_timeout);
    });

    /**
     * Get temperature from input
     * @param {number} temp Temperature in Celsius
     * @returns {number} Rounded temperature
     */
    function getTemp(temp) {
        return Math.round(temp / 100);
    }

    /**
     * Calculate the percentage between two numbers
     * @param {number} layer
     * @param {number} total
     * @returns {number} percentage
     */
    function getPercentage(layer, total) {
        return Math.round((layer / total) * 100);
    }

    /**
     * Truncate a string to a specific length
     * @param {string} str
     * @param {number} maxLength
     * @returns {string} Truncated string
     */
    function truncStr(str, maxLength) {
        if (str.length > maxLength) {
            return str.slice(0, maxLength) + "...";
        } else {
            return str;
        }
    }

    /**
     * Convert time in seconds to hours, minutes, and seconds format
     * @param {number} seconds
     * @returns {string} Formatted time string
     */
    function getTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const remainingSeconds = seconds % 60;

        const timeString = `${hours.toString().padStart(2, "0")}:${minutes
            .toString()
            .padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;

        return timeString;
    }

    /**
     * Get the filament weight based on its length
     * @param {number} length
     * @returns {number} Weight
     */
    function getWeight(length) {
        const diameter = 1.75;
        const density = 1.24;
        const adjustedLength = length / 100;
        console.log(adjustedLength);
        const volume = Math.PI * (diameter / 2) ** 2 * adjustedLength;
        const weight = (volume * density).toFixed(2);
        return weight;
    }

    /**
     * Opens a websocket connection and outputs any incoming message data to console
     */
    socket = new WebSocket("ws://" + location.host + "/ws/mqtt");
    socket.addEventListener("message", (ev) => {
        const data = JSON.parse(ev.data);
        if (data.commandType == 1001) {
            // Returns Print Details
            $("#print_active").attr("style", "display: block;");
            $("#print_name").text(truncStr(data.name, 32));
            $("#time_elapsed").text(getTime(data.totalTime));
            $("#time_remain").text(getTime(data.time));
            $("#filament").text(getWeight(data.filamentUsed));
        } else if (data.commandType == 1003) {
            // Returns Nozzle Temp
            $("#noz_temp").text(getTemp(data.currentTemp));
            $("#noz_target").text(getTemp(data.targetTemp));
        } else if (data.commandType == 1004) {
            // Returns Bed Temp
            $("#bed_temp").text(getTemp(data.currentTemp));
            $("#bed_target").text(getTemp(data.targetTemp));
        } else if (data.commandType == 1052) {
            // Returns Layer Info
            $("#print_layer").text(data.real_print_layer);
            $("#total_layer").text(data.total_layer);
            const printPercent = getPercentage(data.real_print_layer, data.total_layer);
            $("#progressbar").attr("aria-valuenow", printPercent);
            $("#progressbar").attr("style", `width: ${printPercent}%`);
            $("#progress").text(`${printPercent}%`);
        } else if (data.commandType == 1006) {
            // Returns Print Speed
            $("#print_speed").text(data.value);
        }
        console.log(data);
    });

    /**
     * Initializing a new instance of JMuxer for video playback
     */
    var jmuxer;
    jmuxer = new JMuxer({
        node: "player",
        mode: "video",
        flushingTime: 0,
        fps: 15,
        // debug: true,
        onReady: function (data) {
            console.log(data);
        },
        onError: function (data) {
            console.log(data);
        },
    });

    /**
     * Opens a websocket connection for video streaming and feeds the data to the JMuxer instance
     */
    var ws = new WebSocket("ws://" + location.host + "/ws/video");
    ws.binaryType = "arraybuffer";
    ws.addEventListener("message", function (event) {
        jmuxer.feed({
            video: new Uint8Array(event.data),
        });
    });

    ws.addEventListener("error", function (e) {
        console.log("Socket Error");
    });

    /**
     * Opens a websocket connection for controlling video and sends JSON data based on button clicks
     */
    var wsctrl = new WebSocket("ws://" + location.host + "/ws/ctrl");

    /**
     * On click of element with id "light-on", sends JSON data to wsctrl to turn light on
     */
    $("#light-on").on("click", function () {
        wsctrl.send(JSON.stringify({ light: true }));
        return false;
    });

    /**
     * On click of element with id "light-off", sends JSON data to wsctrl to turn light off
     */
    $("#light-off").on("click", function () {
        wsctrl.send(JSON.stringify({ light: false }));
        return false;
    });

    /**
     * On click of element with id "quality-low", sends JSON data to wsctrl to set video quality to low
     */
    $("#quality-low").on("click", function () {
        wsctrl.send(JSON.stringify({ quality: 0 }));
        return false;
    });

    /**
     * On click of element with id "quality-high", sends JSON data to wsctrl to set video quality to high
     */
    $("#quality-high").on("click", function () {
        wsctrl.send(JSON.stringify({ quality: 1 }));
        return false;
    });
});

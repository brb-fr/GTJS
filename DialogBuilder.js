export class DialogBuilder {
    #str = "";
    /**
     * Sets the default color of the dialog
     * @param {string} color
     * @returns {DialogBuilder}
     */
    defaultColor(color) {
        this.#str += `set_default_color|${color || "`o"}\n`;
        return this;
    }
    /**
     * Sets the scalable text
     * @param {string} scale
     * @returns {DialogBuilder}
     */
    textScaling(text) {
        this.#str += `text_scaling_string|${text || ""}\n`;
        return this;
    }
    /**
     * Adds a spacer for the dialog
     * @param {string} type Spacer type, 'big' or 'small'
     * @returns {DialogBuilder}
     */
    addSpacer(type) {
        switch (type.toUpperCase()) {
            case "BIG":
                this.#str += "add_spacer|big|\n";
                break;
            case "SMALL":
                this.#str += "add_spacer|small|\n";
                break;
        }
        return this;
    }
    /**
     * Adds a label
     * @param {string} text Title of the label
     * @param {string} size Type of the label. "small" or "big". default is small
     * @returns {DialogBuilder}
     */
    addLabel(text, size) {
        this.#str += `add_label|${size ?? "small"}|${text}|\n`;
        return this;
    }
    /**
     * Adds a label with an icon
     * @param {string} text Title of the label
     * @param {string | number} titleid The icon to add to the label
     * @param {string} type The type of the label, 'big' or 'small'
     * @returns {DialogBuilder}
     */
    addLabelWithIcon(text, titleid, type) {
        switch (type.toUpperCase()) {
            case "BIG":
                this.#str += `add_label_with_icon|big|${text}|left|${titleid}|\n`;
                break;
            case "SMALL":
                this.#str += `add_label_with_icon|small|${text}|left|${titleid}|\n`;
                break;
        }
        return this;
    }
    embed(key, val) {
        this.#str += `embed_data|${key}|${val}\n`;
        return this;
    }
    /**
     * Adds a button
     * @param {string} name The name of the button
     * @param {string} text The text in the button
     * @returns {DialogBuilder}
     */
    addButton(name, text) {
        this.#str += `add_button|${name}|${text}|noflags|0|0|\n`;
        return this;
    }
    /**
     * Adds a button
     * @param {string} name The name of the button
     * @param {string} title The text in the button
     * @param {string} image The rttex image of the button
     * @param {string} description The description of item being purchased
     * @param {object} imagepos The position of the image
     * @param {string | number} cost The cost of the item
     * @returns {DialogBuilder}
     */
    addStoreButton(name, title, description, image = "", imagepos = { x: 0, y: 0 }, cost = "") {
        this.#str += `add_button|${name}|${title}|${image}|${description}|${imagepos.x}|${imagepos.y}|${cost}|\n`;
        return this;
    }
    /**
     * Adds a button with icon.
     * @param {string | number} name The name of the button
     * @param {string | number} itemID The button icon using itemID
     * @param {string} text The text in the button
     * @returns {DialogBuilder}
     */
    addButtonWithIcon(name, itemID, text, frame = "left", count = 0) {
        this.#str += `add_button_with_icon|${name}|${text}|${frame}|${itemID}|${count ? count : ""}\n`;
        return this;
    }
    /**
     * Adds a custom butto with rttex icon on it.
     * @param name The name of the button
     * @param imageLocation The rttex location
     * @param image_size The image size
     * @param btnWidth The button width
     * @returns {DialogBuilder}
     */
    addCustomButton(name, imageLocation, image_size = { width: 400, height: 260 }, btnWidth = 0.24) {
        this.#str += `add_custom_button|${name}|image:${imageLocation};image_size:${image_size.width},${image_size.height};width:${btnWidth};|\n`;
        return this;
    }
    /**
     * Adds a custom break.
     * @returns {DialogBuilder}
     */
    addCustomBreak() {
        this.#str += "add_custom_break|\n";
        return this;
    }
    /**
     * Adds a checkbox
     * @param {string} name The name of the checkbox
     * @param {string} string The text in the checkbox
     * @param {string} type The type of the checkbox 'selected' or 'not_selected'
     * @returns {DialogBuilder}
     */
    addCheckbox(name, string, type) {
        switch (type.toUpperCase()) {
            case "SELECTED":
                this.#str += `add_checkbox|${name}|${string}|1|\n`;
                break;
            case "NOT_SELECTED":
                this.#str += `add_checkbox|${name}|${string}|0|\n`;
                break;
        }
        return this;
    }
    /**
     * Adds a text box
     * @param {string} str The str to add
     * @returns {DialogBuilder}
     */
    addTextBox(str) {
        this.#str += `add_textbox|${str}|left|\n`;
        return this;
    }
    /**
     * Adds a small text
     * @param {string} str The text to add
     * @returns {DialogBuilder}
     */
    addSmallText(str) {
        this.#str += `add_smalltext|${str}|\n`;
        return this;
    }
    /**
     * Adds an input box
     * @param {string} name The id of the input box
     * @param {string} text The text beside it
     * @param {string | number} cont Default content?
     * @param {string | number} size The max size of the box
     * @returns {DialogBuilder}
     */
    addInputBox(name = "", text = "", cont = "", size = 0) {
        this.#str += `add_text_input|${name}|${text}|${cont}|${size}|\n`;
        return this;
    }
    /**
     * Adds quick exit button
     * @returns {DialogBuilder}
     */
    addQuickExit() {
        this.#str += "add_quick_exit|\n";
        return this;
    }
    /**
     * Adds buttons at the end of the dialog
     * @param {string} name The id of the dialog
     * @param {string} nvm The value of the button when you want it closed/cancelled.
     * @param {string} accept The value of the button when you want it to add a value to the 'dialog_return' packet
     * @returns {DialogBuilder}
     */
    endDialog(name, nvm, accept) {
        this.#str += `end_dialog|${name || ""}|${nvm || ""}|${accept || ""}|\n`;
        return this;
    }
    /**
     * Adds an achievement display.
     * @param {string} title The title of the achievement.
     * @param {string} description The description of the achievement.
     * @param {string | number} itemID The item ID to use as an achievement icon.
     * @returns {DialogBuilder}
     */
    addAchieve(title, description, itemID) {
        this.#str += `add_achieve|${title}|${description}|${itemID}|\n`;
        return this;
    }
    /**
     * Adds an image button, often used for banners.
     * @param {string} imagePath The path to the image resource.
     * @returns {DialogBuilder}
     */
    addImageButton(imagePath) {
        this.#str += `add_image_button|banner|${imagePath}|noflags|\n`;
        return this;
    }
    /**
     * Adds an item picker.
     * @param {string} message The instructional message for the item picker.
     * @param {string} title The title displayed above the item picker.
     * @param {string} pickerText Item Picker text.
     * @returns {DialogBuilder}
     */
    addItemPicker(message, title, pickerText) {
        this.#str += `add_item_picker|${message}|${title}|${pickerText}|\n`;
        return this;
    }
    /**
     * Adds a player picker.
     * @param {string} name The internal name (ID) for this player picker.
     * @param {string} pickerText The text on the button that opens the player picker.
     * @returns {DialogBuilder}
     */
    addPlayerPicker(name, pickerText) {
        this.#str += `add_player_picker|${name}|${pickerText}|\n`;
        return this;
    }
    /**
     * Adds a button that opens a URL.
     * @param {string} buttonText The visible text on the button.
     * @param {string} url The URL to open.
     * @param {string} tooltipText Text that appears on hover or as a subtitle.
     * @returns {DialogBuilder}
     */
    addURLButton(buttonText, url, tooltipText) {
        this.#str += `add_url_button|${buttonText}|${url}|${tooltipText}|\n`;
        return this;
    }
    /**
     * Adds a button that redirects to another world.
     * @param {string} buttonText The visible text on the button.
     * @param {string} targetWorldName The name of the world to redirect to.
     * @param {string} buttonName The internal name (ID) of the button (can be empty).
     * @returns {DialogBuilder}
     */
    addWorldLinkButton(buttonText, targetWorldName, buttonName = "") {
        this.#str += `add_url_button|${buttonName}|${buttonText}|NOFLAGS|OPENWORLD|${targetWorldName}|\n`;
        return this;
    }
    /**
     * Adds player information display.
     * Format: add_player_info|PlayerName|Level|CurrentExp|RequiredExp|
     * @param {string} playerName The name of the player.
     * @param {string | number} level The player's level.
     * @param {string | number} currentExp The player's current experience.
     * @param {string | number} requiredExp The experience required for the player's next level.
     * @returns {DialogBuilder}
     */
    addPlayerInfo(playerName, level, currentExp, requiredExp) {
        this.#str += `add_player_info|${playerName}|${level}|${currentExp}|${requiredExp}|\n`;
        return this;
    }
    /**
     * Adds a raw dialog, useful if the function for that specific dialog would not be here
     * @param {string} str The dialog to add
     * @return {DialogBuilder}
     */
    raw(str) {
        this.#str += `${str}`;
        return this;
    }
    /**
     * Returns the created string
     * @returns {string}
     */
    str() {
        return this.#str;
    }
    /**
     * Removes the value of the str to return
     * @return {DialogBuilder}
     */
    reconstruct() {
        this.#str = "";
        return this;
    }
}

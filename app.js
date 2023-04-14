function parseMarkdown(markdown) {
    const lines = markdown.split('\n');
    let htmlOutput = '';

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        if (line.startsWith('#')) {
            htmlOutput += handleHeader(line);
        } else if (line.startsWith('>')) {
            htmlOutput += handleBlockquote(line);
        } else if (line.startsWith('```')) {
            const fencedCodeBlock = lines.slice(i).join('\n');
            const result = handleFencedCodeBlock(fencedCodeBlock);
            htmlOutput += result.html;
            i += result.linesProcessed - 1;
        } else if (isTable(lines.slice(i))) {
            const table = lines.slice(i).join('\n');
            const result = handleTable(table);
            htmlOutput += result.html;
            i += result.linesProcessed - 1;
        } else if (line.startsWith('- [ ]') || line.startsWith('- [x]')) {
            htmlOutput += handleTaskList(line);
        } else {
            htmlOutput += handleInlineElements(line);
            htmlOutput += '<br>';
        }
    }

    return htmlOutput;
}

function isTable(lines) {
    if (lines.length < 3) return false;

    const headerPattern = /^\s*\|.*\|\s*$/;
    const separatorPattern = /^\s*\|[\s\-\:]*\|\s*$/;

    return headerPattern.test(lines[0]) && separatorPattern.test(lines[1]);
}

// #region block elements

function handleFencedCodeBlock(text) {
    const pattern = /^```([\w-]+)?\n([\s\S]*?)\n```/m;
    const match = text.match(pattern);

    if (match) {
        const language = match[1] || '';
        const code = match[2];
        const html = `<pre><code class="${language}">${code}</code></pre>`;
        const linesProcessed = match[0].split('\n').length;
        return { html, linesProcessed };
    }
    return { html: '', linesProcessed: 0 };
}

function handleTable(text) {
    const pattern = /^((?:\s*\|[^|\n]*\|+\s*\n)+)((?:\s*\|:?-+:?\|+\s*\n)+)((?:(?:\s*\|[^|\n]*\|+\s*\n)*))/m;
    const match = text.match(pattern);

    if (match) {
        const header = match[1].trim();
        const separator = match[2].trim();
        const body = match[3].trim();

        const thead = header.split('\n').map((row) => {
            return row.split('|').slice(1, -1).map((cell) => `<th>${cell.trim()}</th>`).join('');
        }).join('</tr><tr>');

        const tbody = body.split('\n').map((row) => {
            return '<tr>' + row.split('|').slice(1, -1).map((cell) => `<td>${cell.trim()}</td>`).join('') + '</tr>';
        }).join('');

        const html = `<table><thead><tr>${thead}</tr></thead><tbody>${tbody}</tbody></table>`;
        const linesProcessed = match[0].split('\n').length;
        return { html, linesProcessed };
    }
    return { html: '', linesProcessed: 0 };
}

function handleTaskList(line) {
    const pattern = /^(- \[(?:x| )\])(.+)/;
    const match = line.match(pattern);

    if (match) {
        const checked = match[1] === '- [x]';
        const content = match[2].trim();
        const checkbox = `<input type="checkbox" ${checked ? 'checked' : ''} disabled>`;
        return `<li>${checkbox}${content}</li>`;
    }
    return line;
}

// #endregion

// #region inline elements
function handleInlineElements(line) {
    line = handleBold(line);
    line = handleItalic(line);
    line = handleLink(line);
    line = handleInlineCode(line);
    line = handleStrikethrough(line);
    line = handleEmoji(line);
    line = handleHighlight(line);
    line = handleSubscript(line);
    line = handleSuperscript(line);
    return line;
}

function handleHeader(line) {
    const level = line.match(/^#+/)[0].length;
    const content = line.replace(/^#+\s*/, '');
    return `<h${level}>${content}</h${level}>`;
}

function handleBlockquote(line) {
    const pattern = /^>\s*(.+)/;
    const match = line.match(pattern);
    if (match) {
        return `<blockquote>${match[1]}</blockquote>`;
    }
    return line;
}

function handleBold(line) {
    const pattern = /\*\*(.+?)\*\*/g;
    return line.replace(pattern, '<strong>$1</strong>');
}

function handleItalic(line) {
    const pattern = /\*(.+?)\*/g;
    return line.replace(pattern, '<em>$1</em>');
}

function handleLink(line) {
    const pattern = /\[(.+?)\]\((.+?)\)/g;
    return line.replace(pattern, '<a href="$2">$1</a>');
}

function handleInlineCode(line) {
    const pattern = /`(.+?)`/g;
    return line.replace(pattern, '<code>$1</code>');
}

function handleStrikethrough(line) {
    const pattern = /~~(.+?)~~/g;
    return line.replace(pattern, '<del>$1</del>');
}

function handleBlockquote(line) {
    const pattern = /^>\s*(.+)/;
    const match = line.match(pattern);
    if (match) {
        return `<blockquote>${match[1]}</blockquote>`;
    }
    return line;
}

function handleEmoji(line) {
    const pattern = /:(\w+):/g;
    return line.replace(pattern, (match, emojiName) => {
        return `<span class="emoji">${emojiName}</span>`; // You can replace this with actual emoji images or characters.
    });
}

function handleHighlight(line) {
    const pattern = /==(.+?)==/g;
    return line.replace(pattern, '<mark>$1</mark>');
}

function handleSubscript(line) {
    const pattern = /~(.+?)~/g;
    return line.replace(pattern, '<sub>$1</sub>');
}

function handleSuperscript(line) {
    const pattern = /\^(.+?)\^/g;
    return line.replace(pattern, '<sup>$1</sup>');
}

// #endregion

let data = '';
let isEditMode = false;

function markdownToHTML(markdown) {
    return parseMarkdown(markdown);
}
// Read the file content and display the converted HTML
function handleFileDrop(evt) {
    //e.preventDefault();
    dropzone = document.getElementById("dropzone");
    markdownDisplay = document.getElementById("markdown-display");
    markdownEditor = document.getElementById('markdown-editor');

    if (evt.target.files) {
        // Use DataTransferItemList interface to access the file
        const file = evt.target.files[0];
        const reader = new FileReader();

        reader.onload = function (event) {
            const markdownContent = event.target.result;
            data = markdownContent;
            markdownEditor.value = markdownContent;
            isEditMode = true;
            handleToggleButton(null);


            //const htmlContent = markdownToHTML(markdownContent);
            //markdownDisplay.innerHTML = htmlContent;
        };


        reader.readAsText(file);
    }
}

// Toggle between edit and view modes
function handleToggleButton(evt) {
    isEditMode = !isEditMode;
    const markdownViewer = document.getElementById('markdown-display');
    const markdownEditor = document.getElementById('markdown-editor');
    const toggleModeBtn = document.getElementById('toggle-mode-btn');

    if (isEditMode) {
        const markdown = data;
        markdownEditor.value = markdown;
        markdownEditor.style.display = 'block';
        markdownViewer.style.display = 'none';
        toggleModeBtn.textContent = 'Toggle View';
    } else {
        const markdown = markdownEditor.value;
        data = markdown;
        const html = parseMarkdown(markdown);        
        markdownViewer.innerHTML = html;
        markdownEditor.style.display = 'none';
        markdownViewer.style.display = 'block';
        toggleModeBtn.textContent = 'Toggle Edit';
    }
}

function handleSaveButton(evt)
{
    const saveModal = document.getElementById('save-modal');
    saveModal.style.display = 'block';

}

function handleMarkdownEditChage(evt)
{
    data = document.getElementById('markdown-editor').value;
}

function handleSaveFileButton(evt) {
    const markdown = document.getElementById('markdown-editor').value;
    const html = parseMarkdown(markdown);

    const fileFormatRadios = document.getElementsByName('file-format-radio');
    let fileType;
    for (const radio of fileFormatRadios) {
        if (radio.checked) {
            fileType = radio.value;
            break;
        }
    }

    let data, mimeType, extension;
    if (fileType === 'html') {
        data = html;
        mimeType = 'text/html';
        extension = 'html';
    } else {
        data = markdown;
        mimeType = 'text/markdown';
        extension = 'md';
    }

    const blob = new Blob([data], { type: mimeType });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `file.${extension}`;
    link.click();

    URL.revokeObjectURL(url);
    document.getElementById('save-modal').style.display = 'none';
}

function handleCancelSaveButton() {
    document.getElementById('save-modal').style.display = 'none';
}

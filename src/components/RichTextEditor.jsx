import React, { useState, useRef, useEffect } from 'react';
import {
    Card,
    BlockStack,
    InlineStack,
    Button,
    ButtonGroup,
    Text,
    Popover,
    ActionList,
    Box,
    Tooltip,
    Divider,
} from '@shopify/polaris';
import {
    TextBoldIcon,
    TextItalicIcon,
    TextUnderlineIcon,
    CodeIcon,
    LinkIcon,
    ListBulletedIcon,
    ListNumberedIcon,
    TextAlignLeftIcon,
    TextAlignCenterIcon,
    TextAlignRightIcon,
} from '@shopify/polaris-icons';

export function RichTextEditor({ 
    value, 
    onChange, 
    placeholder = "Content",
    mergeTags = [],
    label = "Content"
}) {
    const editorRef = useRef(null);
    const [isSourceMode, setIsSourceMode] = useState(false);
    const [sourceValue, setSourceValue] = useState('');
    const [fontSizePopoverActive, setFontSizePopoverActive] = useState(false);
    const [selectedFontSize, setSelectedFontSize] = useState('11');
    const [linkPopoverActive, setLinkPopoverActive] = useState(false);
    const [linkText, setLinkText] = useState('');
    const [linkUrl, setLinkUrl] = useState('');
    const [colorPickerActive, setColorPickerActive] = useState(false);
    const isInitialMount = useRef(true);
    const isUserTyping = useRef(false);

    const fontSizes = ['8', '9', '10', '11', '12', '14', '16', '18', '20', '24', '30', '36'];

    // Only set initial value, don't update while user is typing
    useEffect(() => {
        if (editorRef.current && !isSourceMode && isInitialMount.current) {
            editorRef.current.innerHTML = value || '';
            isInitialMount.current = false;
        }
    }, []);

    // Update content when switching from source mode or when value changes externally (not from typing)
    useEffect(() => {
        if (editorRef.current && !isSourceMode && !isUserTyping.current && value !== undefined) {
            const currentContent = editorRef.current.innerHTML;
            if (currentContent !== value && value !== '') {
                editorRef.current.innerHTML = value;
            }
        }
    }, [value, isSourceMode]);

    const execCommand = (command, value = null) => {
        if (isSourceMode) return;
        document.execCommand(command, false, value);
        handleInput();
    };

    const handleInput = () => {
        if (editorRef.current) {
            isUserTyping.current = true;
            onChange(editorRef.current.innerHTML);
            // Reset typing flag after a short delay
            setTimeout(() => {
                isUserTyping.current = false;
            }, 100);
        }
    };

    const toggleSourceMode = () => {
        if (isSourceMode) {
            // Switching back to visual mode
            if (editorRef.current) {
                editorRef.current.innerHTML = sourceValue;
                onChange(sourceValue);
            }
        } else {
            // Switching to source mode
            setSourceValue(value || '');
        }
        setIsSourceMode(!isSourceMode);
    };

    const handleSourceChange = (e) => {
        setSourceValue(e.target.value);
        onChange(e.target.value);
    };

    const applyFontSize = (size) => {
        execCommand('fontSize', '7');
        const fontElements = editorRef.current.querySelectorAll('font[size="7"]');
        fontElements.forEach(el => {
            el.removeAttribute('size');
            el.style.fontSize = size + 'px';
        });
        setSelectedFontSize(size);
        setFontSizePopoverActive(false);
        handleInput();
    };

    const insertMergeTag = (tag) => {
        if (editorRef.current) {
            editorRef.current.focus();
            const selection = window.getSelection();
            
            if (selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                const tagNode = document.createTextNode(tag);
                range.insertNode(tagNode);
                range.setStartAfter(tagNode);
                range.collapse(true);
                selection.removeAllRanges();
                selection.addRange(range);
            } else {
                // If no selection, append at the end
                editorRef.current.appendChild(document.createTextNode(tag));
            }
            
            handleInput();
        }
    };

    const handleInsertLink = () => {
        if (linkText && linkUrl) {
            const anchor = `<a href="${linkUrl}" target="_blank">${linkText}</a>`;
            document.execCommand('insertHTML', false, anchor);
            handleInput();
            setLinkText('');
            setLinkUrl('');
            setLinkPopoverActive(false);
        }
    };

    const handleColorChange = (color) => {
        execCommand('foreColor', color);
        setColorPickerActive(false);
    };

    return (
        <BlockStack gap="0">
            {/* Label */}
            <Box paddingBlockEnd="200">
                <Text variant="bodySm" fontWeight="medium" as="label">
                    {label}
                </Text>
            </Box>

            {/* Main Editor Card */}
            <Card padding="0">
                <BlockStack gap="0">
                    {/* Toolbar */}
                    <Box background="bg-surface-secondary" padding="300" borderBlockEndWidth="025" borderColor="border">
                        <InlineStack gap="200" wrap={false} blockAlign="center">
                            {/* Bold, Italic, Underline */}
                            <Button 
                                icon={TextBoldIcon} 
                                onClick={() => execCommand('bold')}
                                size="micro"
                                variant="tertiary"
                            />
                            <Button 
                                icon={TextItalicIcon} 
                                onClick={() => execCommand('italic')}
                                size="micro"
                                variant="tertiary"
                            />
                            <Button 
                                icon={TextUnderlineIcon} 
                                onClick={() => execCommand('underline')}
                                size="micro"
                                variant="tertiary"
                            />

                            <Box paddingInlineStart="100" paddingInlineEnd="100">
                                <div style={{ width: '1px', height: '20px', background: '#e1e3e5' }} />
                            </Box>

                            {/* Strikethrough */}
                            <Button 
                                onClick={() => execCommand('strikeThrough')}
                                size="micro"
                                variant="tertiary"
                            >
                                <span style={{ textDecoration: 'line-through' }}>S</span>
                            </Button>

                            {/* Subscript */}
                            <Button 
                                onClick={() => execCommand('subscript')}
                                size="micro"
                                variant="tertiary"
                            >
                                x<sub>2</sub>
                            </Button>

                            {/* Superscript */}
                            <Button 
                                onClick={() => execCommand('superscript')}
                                size="micro"
                                variant="tertiary"
                            >
                                x<sup>2</sup>
                            </Button>

                            <Box paddingInlineStart="100" paddingInlineEnd="100">
                                <div style={{ width: '1px', height: '20px', background: '#e1e3e5' }} />
                            </Box>

                            {/* Font Size Dropdown */}
                            <Popover
                                active={fontSizePopoverActive}
                                activator={
                                    <Button 
                                        onClick={() => setFontSizePopoverActive(!fontSizePopoverActive)}
                                        disclosure
                                        size="micro"
                                        variant="tertiary"
                                    >
                                        {selectedFontSize}
                                    </Button>
                                }
                                onClose={() => setFontSizePopoverActive(false)}
                            >
                                <ActionList
                                    items={fontSizes.map(size => ({
                                        content: `${size}px`,
                                        onAction: () => applyFontSize(size),
                                    }))}
                                />
                            </Popover>

                            {/* Text Color */}
                            <Popover
                                active={colorPickerActive}
                                activator={
                                    <Button 
                                        onClick={() => setColorPickerActive(!colorPickerActive)}
                                        size="micro"
                                        variant="tertiary"
                                    >
                                        <span style={{ fontWeight: 'bold', fontSize: '14px' }}>A</span>
                                    </Button>
                                }
                                onClose={() => setColorPickerActive(false)}
                            >
                                <Box padding="300">
                                    <input
                                        type="color"
                                        onChange={(e) => handleColorChange(e.target.value)}
                                        style={{ width: '150px', height: '40px', cursor: 'pointer', border: 'none' }}
                                    />
                                </Box>
                            </Popover>

                            <Box paddingInlineStart="100" paddingInlineEnd="100">
                                <div style={{ width: '1px', height: '20px', background: '#e1e3e5' }} />
                            </Box>

                            {/* Bullet List */}
                            <Button 
                                icon={ListBulletedIcon} 
                                onClick={() => execCommand('insertUnorderedList')}
                                size="micro"
                                variant="tertiary"
                            />

                            {/* Numbered List */}
                            <Button 
                                icon={ListNumberedIcon} 
                                onClick={() => execCommand('insertOrderedList')}
                                size="micro"
                                variant="tertiary"
                            />

                            <Box paddingInlineStart="100" paddingInlineEnd="100">
                                <div style={{ width: '1px', height: '20px', background: '#e1e3e5' }} />
                            </Box>

                            {/* Alignment Buttons */}
                            <Button 
                                icon={TextAlignLeftIcon} 
                                onClick={() => execCommand('justifyLeft')}
                                size="micro"
                                variant="tertiary"
                            />
                            <Button 
                                icon={TextAlignCenterIcon} 
                                onClick={() => execCommand('justifyCenter')}
                                size="micro"
                                variant="tertiary"
                            />
                            <Button 
                                icon={TextAlignRightIcon} 
                                onClick={() => execCommand('justifyRight')}
                                size="micro"
                                variant="tertiary"
                            />
                            <Tooltip content="Justify">
                                <Button 
                                    onClick={() => execCommand('justifyFull')}
                                    size="micro"
                                    variant="tertiary"
                                >
                                    ≡
                                </Button>
                            </Tooltip>

                            <Box paddingInlineStart="100" paddingInlineEnd="100">
                                <div style={{ width: '1px', height: '20px', background: '#e1e3e5' }} />
                            </Box>

                            {/* Indent/Outdent */}
                            <Button 
                                onClick={() => execCommand('outdent')}
                                size="micro"
                                variant="tertiary"
                            >
                                ◀
                            </Button>
                            <Button 
                                onClick={() => execCommand('indent')}
                                size="micro"
                                variant="tertiary"
                            >
                                ▶
                            </Button>

                            {/* View Source */}
                            <Button 
                                icon={CodeIcon} 
                                onClick={toggleSourceMode}
                                pressed={isSourceMode}
                                size="micro"
                                variant="tertiary"
                            />

                            {/* Link */}
                            <Popover
                                active={linkPopoverActive}
                                activator={
                                    <Button 
                                        icon={LinkIcon}
                                        onClick={() => setLinkPopoverActive(!linkPopoverActive)}
                                        size="micro"
                                        variant="tertiary"
                                    />
                                }
                                onClose={() => setLinkPopoverActive(false)}
                            >
                                <Box padding="400" minWidth="300px">
                                    <BlockStack gap="300">
                                        <input
                                            type="text"
                                            placeholder="Link text"
                                            value={linkText}
                                            onChange={(e) => setLinkText(e.target.value)}
                                            style={{
                                                width: '100%',
                                                padding: '8px',
                                                border: '1px solid #c9cccf',
                                                borderRadius: '8px',
                                                fontSize: '14px'
                                            }}
                                        />
                                        <input
                                            type="text"
                                            placeholder="URL"
                                            value={linkUrl}
                                            onChange={(e) => setLinkUrl(e.target.value)}
                                            style={{
                                                width: '100%',
                                                padding: '8px',
                                                border: '1px solid #c9cccf',
                                                borderRadius: '8px',
                                                fontSize: '14px'
                                            }}
                                        />
                                        <Button variant="primary" onClick={handleInsertLink}>
                                            Insert Link
                                        </Button>
                                    </BlockStack>
                                </Box>
                            </Popover>
                        </InlineStack>
                    </Box>

                    {/* Editor Area */}
                    <Box padding="400">
                        {isSourceMode ? (
                            <textarea
                                value={sourceValue}
                                onChange={handleSourceChange}
                                placeholder={placeholder}
                                style={{
                                    width: '100%',
                                    minHeight: '200px',
                                    padding: '12px',
                                    border: '1px solid #c9cccf',
                                    borderRadius: '8px',
                                    fontFamily: 'monospace',
                                    fontSize: '13px',
                                    resize: 'vertical',
                                }}
                            />
                        ) : (
                            <div
                                ref={editorRef}
                                contentEditable
                                onInput={handleInput}
                                style={{
                                    minHeight: '200px',
                                    padding: '12px',
                                    border: '1px solid #c9cccf',
                                    borderRadius: '8px',
                                    outline: 'none',
                                    fontSize: '14px',
                                    lineHeight: '1.6',
                                    backgroundColor: '#ffffff',
                                }}
                                suppressContentEditableWarning
                            />
                        )}
                    </Box>
                </BlockStack>
            </Card>

            {/* Merge Tags Section */}
            {mergeTags && mergeTags.length > 0 && (
                <Box paddingBlockStart="400">
                    <BlockStack gap="300">
                        <Text variant="bodyMd" fontWeight="semibold" as="h3">
                            Merge tags you can use
                        </Text>
                        <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: 'repeat(2, 1fr)', 
                            gap: '12px' 
                        }}>
                            {mergeTags.map((tag) => (
                                <div
                                    key={tag.tag}
                                    onClick={() => insertMergeTag(tag.tag)}
                                    style={{
                                        padding: '16px',
                                        background: '#ffffff',
                                        border: '1px solid #c9cccf',
                                        borderRadius: '8px',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'flex-start',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.borderColor = '#2c6ecb';
                                        e.currentTarget.style.boxShadow = '0 0 0 1px #2c6ecb';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.borderColor = '#c9cccf';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }}
                                >
                                    <div style={{ flex: 1 }}>
                                        <Text variant="bodyMd" fontWeight="semibold" as="p">
                                            {tag.tag}
                                        </Text>
                                        <Text variant="bodySm" tone="subdued" as="p">
                                            {tag.description}
                                        </Text>
                                    </div>
                                    <div style={{ 
                                        padding: '6px 10px', 
                                        background: '#f3f4f6', 
                                        borderRadius: '6px',
                                        marginLeft: '12px',
                                        cursor: 'pointer',
                                        fontSize: '16px'
                                    }}>
                                        📋
                                    </div>
                                </div>
                            ))}
                        </div>
                    </BlockStack>
                </Box>
            )}
        </BlockStack>
    );
}
import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Item } from '../types';
import { Trash2, GripVertical, Circle, CheckCircle2, CloudUpload, Tag, FileText, Home, HelpCircle, Check, ShoppingCart } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
    SwipeableList,
    SwipeableListItem,
    SwipeAction,
    LeadingActions,
    TrailingActions,
    Type as ListType,
} from 'react-swipeable-list';
import 'react-swipeable-list/dist/styles.css';

interface SortableItemProps {
    item: Item;
    onToggle?: (id: string) => void;
    onDelete?: (id: string) => void;
    onEdit?: (id: string, text: string) => void;
    onEditNote?: (id: string, note?: string) => void;
    onTogglecheckIfExistAtHome?: (id: string) => void;
    onCategorize?: (id: string) => void;
    disabled?: boolean;
    isCategorized?: boolean;
    onEditingChange?: (isEditing: boolean) => void;
}

export const SortableItem: React.FC<SortableItemProps> = ({
    item,
    onToggle,
    onDelete,
    onEdit,
    onEditNote,
    onTogglecheckIfExistAtHome,
    onCategorize,
    disabled,
    isCategorized,
    onEditingChange
}) => {
    const { t } = useTranslation();
    const [localText, setLocalText] = React.useState(item.text);
    const [localNote, setLocalNote] = React.useState(item.note || '');
    const [isEditingNote, setIsEditingNote] = React.useState(false);
    const inputRef = React.useRef<HTMLInputElement>(null);
    const noteInputRef = React.useRef<HTMLInputElement>(null);

    React.useEffect(() => {
        setLocalText(item.text);
    }, [item.text]);

    React.useEffect(() => {
        setLocalNote(item.note || '');
    }, [item.note]);

    const handleBlur = () => {
        onEditingChange?.(false);
        if (onEdit && localText !== item.text) {
            onEdit(item.id, localText);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            (e.target as HTMLInputElement).blur();
        }
    };

    const handleNoteBlur = () => {
        onEditingChange?.(false);
        const trimmed = localNote.trim();
        if (onEditNote && trimmed !== (item.note || '')) {
            onEditNote(item.id, trimmed || undefined);
        }
        if (!trimmed) {
            setIsEditingNote(false);
        }
    };

    const handleNoteKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            (e.target as HTMLInputElement).blur();
        } else if (e.key === 'Escape') {
            setLocalNote(item.note || '');
            setIsEditingNote(false);
            onEditingChange?.(false);
        }
    };

    const handleToggleNoteEdit = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!isEditingNote) {
            setIsEditingNote(true);
            onEditingChange?.(true);
            setTimeout(() => noteInputRef.current?.focus(), 50);
        } else {
            handleNoteBlur();
            setIsEditingNote(false);
            onEditingChange?.(false);
        }
    };

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: item.id, disabled });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const leadingActions = () => (
        <LeadingActions>
            <SwipeAction
                onClick={() => {
                    if (onTogglecheckIfExistAtHome) {
                        onTogglecheckIfExistAtHome(item.id);
                    } else {
                        inputRef.current?.focus();
                    }
                }}
            >
                <div className="flex items-center justify-start px-4 bg-amber-500 text-white h-full rounded-l-lg">
                    <div className="flex items-center gap-1.5">
                        <Home size={18} />
                        <HelpCircle size={16} />
                    </div>
                </div>
            </SwipeAction>
        </LeadingActions>
    );

    const trailingActions = () => (
        <TrailingActions>
            <SwipeAction
                destructive={true}
                onClick={() => onDelete && onDelete(item.id)}
            >
                <div className="flex items-center justify-end px-4 bg-red-500 text-white h-full rounded-r-lg">
                    <Trash2 size={24} />
                </div>
            </SwipeAction>
        </TrailingActions>
    );

    const isReadOnly = !onToggle && !onEdit;
    const isInteractionDisabled = isReadOnly;

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`relative group ${isDragging ? 'z-50' : ''}`}
        >
            <SwipeableList threshold={0.25} type={ListType.IOS}>
                <SwipeableListItem
                    leadingActions={leadingActions()}
                    trailingActions={trailingActions()}
                >
                    <div className={`w-full flex items-center gap-3 p-3 rounded-lg border shadow-sm transition-colors ${
                        item.checkIfExistAtHome && !item.completed
                            ? 'bg-amber-50/80 dark:bg-amber-950/20 border-amber-200 dark:border-amber-700/60'
                            : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700'
                    }`}>
                        {/* We need to wrap the content to allow leading actions to be visible */}
                        <div className="flex flex-wrap items-center gap-3 w-full">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (onToggle) onToggle(item.id);
                                    }}
                                    className={`flex-shrink-0 transition-colors ${isInteractionDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    aria-label={item.completed ? "Mark as incomplete" : "Mark as complete"}
                                    onMouseDown={(e) => e.stopPropagation()}
                                    onTouchStart={(e) => e.stopPropagation()}
                                >
                                    {/* Render different icons based on state */}
                                    {(() => {
                                        if (item.completed) {
                                            return (
                                                <div className="text-blue-500 hover:text-blue-600">
                                                    <CheckCircle2 size={24} />
                                                </div>
                                            );
                                        }
                                        return (
                                            <div className="text-gray-300 hover:text-gray-400">
                                                <Circle size={24} />
                                            </div>
                                        );
                                    })()}
                                </button>

                                <div className="flex-1 min-w-0 flex flex-col justify-center">
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        value={localText}
                                        onChange={(e) => setLocalText(e.target.value)}
                                        onFocus={() => onEditingChange?.(true)}
                                        onBlur={handleBlur}
                                        onKeyDown={handleKeyDown}
                                        disabled={isReadOnly}
                                        aria-label="Edit item text"
                                        className={`w-full bg-transparent outline-none p-0.5 text-sm ${(() => {
                                            if (item.completed) return 'line-through text-gray-400';
                                            return 'text-gray-700 dark:text-gray-200';
                                        })()} ${isReadOnly ? 'cursor-not-allowed' : ''}`}
                                        onMouseDown={(e) => e.stopPropagation()}
                                        onTouchStart={(e) => e.stopPropagation()}
                                    />
                                     {!item.completed && (isEditingNote || item.note) && (
                                         <div className="px-0.5 mt-0.5">
                                            {isEditingNote ? (
                                                <input
                                                    ref={noteInputRef}
                                                    type="text"
                                                    value={localNote}
                                                    onChange={(e) => setLocalNote(e.target.value)}
                                                    onFocus={() => onEditingChange?.(true)}
                                                    onBlur={handleNoteBlur}
                                                    onKeyDown={handleNoteKeyDown}
                                                    placeholder={t('lists.notePlaceholder')}
                                                    disabled={isReadOnly}
                                                    aria-label="Edit item note"
                                                    className="w-full bg-transparent outline-none text-xs text-gray-600 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500 border-b border-blue-400/40 dark:border-blue-500/40 py-0.5"
                                                    onMouseDown={(e) => e.stopPropagation()}
                                                    onTouchStart={(e) => e.stopPropagation()}
                                                />
                                            ) : (
                                                <span
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (!isReadOnly) {
                                                            setIsEditingNote(true);
                                                            onEditingChange?.(true);
                                                            setTimeout(() => noteInputRef.current?.focus(), 50);
                                                        }
                                                    }}
                                                    className={`block text-xs truncate transition-colors ${
                                                        item.completed ? 'line-through text-gray-400/70' : 'text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 cursor-pointer'
                                                    }`}
                                                    title={item.note}
                                                >
                                                    {item.note}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-1 sm:gap-3 flex-shrink-0">
                                <div className="flex items-center gap-1.5">
                                    {item.checkIfExistAtHome && !item.completed && (
                                        <>
                                            {onToggle && (
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onToggle(item.id);
                                                    }}
                                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/60 transition-colors"
                                                    title={t('lists.inStockAtHome')}
                                                    onMouseDown={(e) => e.stopPropagation()}
                                                    onTouchStart={(e) => e.stopPropagation()}
                                                >
                                                    <Check size={11} />
                                                    <span className="hidden xs:inline">{t('lists.inStockAtHome')}</span>
                                                </button>
                                            )}
                                            {onTogglecheckIfExistAtHome && (
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onTogglecheckIfExistAtHome(item.id);
                                                    }}
                                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/60 transition-colors"
                                                    title={t('lists.buyInStore')}
                                                    onMouseDown={(e) => e.stopPropagation()}
                                                    onTouchStart={(e) => e.stopPropagation()}
                                                >
                                                    <ShoppingCart size={11} />
                                                    <span className="hidden xs:inline">{t('lists.buyInStore')}</span>
                                                </button>
                                            )}
                                        </>
                                    )}
                                </div>

                                 <div className="flex items-center gap-1 sm:gap-3">
                                     {onTogglecheckIfExistAtHome && !isReadOnly && !item.completed && (
                                         <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onTogglecheckIfExistAtHome(item.id);
                                            }}
                                            className={`flex-shrink-0 p-1.5 rounded-lg transition-colors ${
                                                item.checkIfExistAtHome
                                                    ? 'text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30'
                                                    : 'text-gray-400 hover:text-amber-500 dark:text-gray-500 dark:hover:text-amber-400'
                                            }`}
                                            aria-label={t('lists.checkIfExistAtHome')}
                                            title={t('lists.checkIfExistAtHome')}
                                            onMouseDown={(e) => e.stopPropagation()}
                                            onTouchStart={(e) => e.stopPropagation()}
                                        >
                                            <Home size={16} />
                                        </button>
                                    )}

                                     {onEditNote && !isReadOnly && !item.completed && (
                                         <button
                                            onClick={handleToggleNoteEdit}
                                            className={`flex-shrink-0 p-1.5 rounded-lg transition-colors ${
                                                item.note
                                                    ? 'text-blue-500 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                                                    : 'text-gray-400 hover:text-blue-500 dark:text-gray-500 dark:hover:text-blue-400'
                                            }`}
                                            aria-label={item.note ? t('lists.editNote') : t('lists.addNote')}
                                            title={item.note ? t('lists.editNote') : t('lists.addNote')}
                                            onMouseDown={(e) => e.stopPropagation()}
                                            onTouchStart={(e) => e.stopPropagation()}
                                        >
                                            <FileText size={16} />
                                        </button>
                                    )}

                                    {onCategorize && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onCategorize(item.id);
                                            }}
                                            className={`flex-shrink-0 p-1 transition-colors ${
                                                (item.sectionId || isCategorized) 
                                                    ? 'text-gray-400 hover:text-blue-500 dark:text-gray-500 dark:hover:text-blue-400' 
                                                    : 'text-amber-400 hover:text-blue-500 dark:text-amber-500 dark:hover:text-blue-400 animate-pulse hover:animate-none'
                                            }`}
                                            aria-label="Categorize item"
                                            title="Categorize item"
                                            onMouseDown={(e) => e.stopPropagation()}
                                            onTouchStart={(e) => e.stopPropagation()}
                                        >
                                            <Tag size={16} />
                                        </button>
                                    )}

                                    {item.isPending && (
                                        <div className="flex-shrink-0 text-blue-400 dark:text-blue-500 animate-in fade-in duration-300" title="Syncing...">
                                            <CloudUpload size={16} />
                                        </div>
                                    )}

                                    {!disabled && (
                                        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 touch-none" aria-label="Drag to reorder item">
                                            <GripVertical size={24} strokeWidth={2.5} />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </SwipeableListItem>
            </SwipeableList>
        </div>
    );
};
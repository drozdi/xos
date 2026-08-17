<?php

namespace Board\Enum;

enum ActivityAction: string
{
    case CardCreated = 'card_created';
    case CardMoved = 'card_moved';
    case CardUpdated = 'card_updated';
    case CommentAdded = 'comment_added';
    case ChecklistItemChecked = 'checklist_item_checked';
}

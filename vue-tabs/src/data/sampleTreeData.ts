import type { TreeData } from '../types/Tree'

export const sampleTreeData: TreeData = {
  tree: [
    {
      id: 1,
      parentId: 0,
      title: 'תנ"ך',
      level: 1,
      books: [],
      children: [
        {
          id: 2,
          parentId: 1,
          title: 'תורה',
          level: 2,
          books: [
            {
              id: 1,
              categoryId: 2,
              title: 'בראשית',
              heShortDesc: 'ספר בראשית - ספר ראשון בתורה',
              fullCategory: 'תנ"ך > תורה',
              orderIndex: 1,
              totalLines: 1534,
              hasTargumConnection: 1,
              hasReferenceConnection: 1,
              hasCommentaryConnection: 1,
              hasOtherConnection: 0
            },
            {
              id: 2,
              categoryId: 2,
              title: 'שמות',
              heShortDesc: 'ספר שמות - ספר שני בתורה',
              orderIndex: 2,
              totalLines: 1209,
              hasTargumConnection: 1,
              hasReferenceConnection: 1,
              hasCommentaryConnection: 1,
              hasOtherConnection: 0
            },
            {
              id: 3,
              categoryId: 2,
              title: 'ויקרא',
              heShortDesc: 'ספר ויקרא - ספר שלישי בתורה',
              orderIndex: 3,
              totalLines: 859,
              hasTargumConnection: 1,
              hasReferenceConnection: 1,
              hasCommentaryConnection: 1,
              hasOtherConnection: 0
            },
            {
              id: 4,
              categoryId: 2,
              title: 'במדבר',
              heShortDesc: 'ספר במדבר - ספר רביעי בתורה',
              orderIndex: 4,
              totalLines: 1288,
              hasTargumConnection: 1,
              hasReferenceConnection: 1,
              hasCommentaryConnection: 1,
              hasOtherConnection: 0
            },
            {
              id: 5,
              categoryId: 2,
              title: 'דברים',
              heShortDesc: 'ספר דברים - ספר חמישי בתורה',
              orderIndex: 5,
              totalLines: 955,
              hasTargumConnection: 1,
              hasReferenceConnection: 1,
              hasCommentaryConnection: 1,
              hasOtherConnection: 0
            }
          ],
          children: []
        },
        {
          id: 3,
          parentId: 1,
          title: 'נביאים',
          level: 2,
          books: [],
          children: [
            {
              id: 4,
              parentId: 3,
              title: 'נביאים ראשונים',
              level: 3,
              books: [
                {
                  id: 6,
                  categoryId: 4,
                  title: 'יהושע',
                  heShortDesc: 'ספר יהושע',
                  orderIndex: 1,
                  totalLines: 656,
                  hasTargumConnection: 0,
                  hasReferenceConnection: 1,
                  hasCommentaryConnection: 1,
                  hasOtherConnection: 0
                },
                {
                  id: 7,
                  categoryId: 4,
                  title: 'שופטים',
                  heShortDesc: 'ספר שופטים',
                  orderIndex: 2,
                  totalLines: 618,
                  hasTargumConnection: 0,
                  hasReferenceConnection: 1,
                  hasCommentaryConnection: 1,
                  hasOtherConnection: 0
                },
                {
                  id: 8,
                  categoryId: 4,
                  title: 'שמואל א',
                  heShortDesc: 'ספר שמואל א',
                  orderIndex: 3,
                  totalLines: 810,
                  hasTargumConnection: 0,
                  hasReferenceConnection: 1,
                  hasCommentaryConnection: 1,
                  hasOtherConnection: 0
                },
                {
                  id: 9,
                  categoryId: 4,
                  title: 'שמואל ב',
                  heShortDesc: 'ספר שמואל ב',
                  orderIndex: 4,
                  totalLines: 695,
                  hasTargumConnection: 0,
                  hasReferenceConnection: 1,
                  hasCommentaryConnection: 1,
                  hasOtherConnection: 0
                }
              ],
              children: []
            },
            {
              id: 5,
              parentId: 3,
              title: 'נביאים אחרונים',
              level: 3,
              books: [
                {
                  id: 10,
                  categoryId: 5,
                  title: 'ישעיהו',
                  heShortDesc: 'ספר ישעיהו',
                  orderIndex: 1,
                  totalLines: 1292,
                  hasTargumConnection: 0,
                  hasReferenceConnection: 1,
                  hasCommentaryConnection: 1,
                  hasOtherConnection: 0
                },
                {
                  id: 11,
                  categoryId: 5,
                  title: 'ירמיהו',
                  heShortDesc: 'ספר ירמיהו',
                  orderIndex: 2,
                  totalLines: 1364,
                  hasTargumConnection: 0,
                  hasReferenceConnection: 1,
                  hasCommentaryConnection: 1,
                  hasOtherConnection: 0
                },
                {
                  id: 12,
                  categoryId: 5,
                  title: 'יחזקאל',
                  heShortDesc: 'ספר יחזקאל',
                  orderIndex: 3,
                  totalLines: 1273,
                  hasTargumConnection: 0,
                  hasReferenceConnection: 1,
                  hasCommentaryConnection: 1,
                  hasOtherConnection: 0
                }
              ],
              children: []
            }
          ]
        },
        {
          id: 6,
          parentId: 1,
          title: 'כתובים',
          level: 2,
          books: [
            {
              id: 13,
              categoryId: 6,
              title: 'תהלים',
              heShortDesc: 'ספר תהלים',
              orderIndex: 1,
              totalLines: 2527,
              hasTargumConnection: 0,
              hasReferenceConnection: 1,
              hasCommentaryConnection: 1,
              hasOtherConnection: 0
            },
            {
              id: 14,
              categoryId: 6,
              title: 'משלי',
              heShortDesc: 'ספר משלי',
              orderIndex: 2,
              totalLines: 915,
              hasTargumConnection: 0,
              hasReferenceConnection: 1,
              hasCommentaryConnection: 1,
              hasOtherConnection: 0
            },
            {
              id: 15,
              categoryId: 6,
              title: 'איוב',
              heShortDesc: 'ספר איוב',
              orderIndex: 3,
              totalLines: 1070,
              hasTargumConnection: 0,
              hasReferenceConnection: 1,
              hasCommentaryConnection: 1,
              hasOtherConnection: 0
            }
          ],
          children: []
        }
      ]
    },
    {
      id: 7,
      parentId: 0,
      title: 'משנה',
      level: 1,
      books: [],
      children: [
        {
          id: 8,
          parentId: 7,
          title: 'זרעים',
          level: 2,
          books: [
            {
              id: 16,
              categoryId: 8,
              title: 'ברכות',
              heShortDesc: 'מסכת ברכות',
              orderIndex: 1,
              totalLines: 543,
              hasTargumConnection: 0,
              hasReferenceConnection: 1,
              hasCommentaryConnection: 1,
              hasOtherConnection: 1
            },
            {
              id: 17,
              categoryId: 8,
              title: 'פאה',
              heShortDesc: 'מסכת פאה',
              orderIndex: 2,
              totalLines: 89,
              hasTargumConnection: 0,
              hasReferenceConnection: 1,
              hasCommentaryConnection: 1,
              hasOtherConnection: 0
            }
          ],
          children: []
        },
        {
          id: 9,
          parentId: 7,
          title: 'מועד',
          level: 2,
          books: [
            {
              id: 18,
              categoryId: 9,
              title: 'שבת',
              heShortDesc: 'מסכת שבת',
              orderIndex: 1,
              totalLines: 1521,
              hasTargumConnection: 0,
              hasReferenceConnection: 1,
              hasCommentaryConnection: 1,
              hasOtherConnection: 1
            },
            {
              id: 19,
              categoryId: 9,
              title: 'עירובין',
              heShortDesc: 'מסכת עירובין',
              orderIndex: 2,
              totalLines: 1050,
              hasTargumConnection: 0,
              hasReferenceConnection: 1,
              hasCommentaryConnection: 1,
              hasOtherConnection: 0
            }
          ],
          children: []
        }
      ]
    }
  ],
  allBooks: [
    { id: 1, categoryId: 2, title: 'בראשית', heShortDesc: 'ספר בראשית - ספר ראשון בתורה', fullCategory: 'תנ"ך > תורה', orderIndex: 1, totalLines: 1534, hasTargumConnection: 1, hasReferenceConnection: 1, hasCommentaryConnection: 1, hasOtherConnection: 0 },
    { id: 2, categoryId: 2, title: 'שמות', heShortDesc: 'ספר שמות - ספר שני בתורה', fullCategory: 'תנ"ך > תורה', orderIndex: 2, totalLines: 1209, hasTargumConnection: 1, hasReferenceConnection: 1, hasCommentaryConnection: 1, hasOtherConnection: 0 },
    { id: 3, categoryId: 2, title: 'ויקרא', heShortDesc: 'ספר ויקרא - ספר שלישי בתורה', fullCategory: 'תנ"ך > תורה', orderIndex: 3, totalLines: 859, hasTargumConnection: 1, hasReferenceConnection: 1, hasCommentaryConnection: 1, hasOtherConnection: 0 },
    { id: 4, categoryId: 2, title: 'במדבר', heShortDesc: 'ספר במדבר - ספר רביעי בתורה', fullCategory: 'תנ"ך > תורה', orderIndex: 4, totalLines: 1288, hasTargumConnection: 1, hasReferenceConnection: 1, hasCommentaryConnection: 1, hasOtherConnection: 0 },
    { id: 5, categoryId: 2, title: 'דברים', heShortDesc: 'ספר דברים - ספר חמישי בתורה', fullCategory: 'תנ"ך > תורה', orderIndex: 5, totalLines: 955, hasTargumConnection: 1, hasReferenceConnection: 1, hasCommentaryConnection: 1, hasOtherConnection: 0 },
    { id: 6, categoryId: 4, title: 'יהושע', heShortDesc: 'ספר יהושע', orderIndex: 1, totalLines: 656, hasTargumConnection: 0, hasReferenceConnection: 1, hasCommentaryConnection: 1, hasOtherConnection: 0 },
    { id: 7, categoryId: 4, title: 'שופטים', heShortDesc: 'ספר שופטים', orderIndex: 2, totalLines: 618, hasTargumConnection: 0, hasReferenceConnection: 1, hasCommentaryConnection: 1, hasOtherConnection: 0 },
    { id: 8, categoryId: 4, title: 'שמואל א', heShortDesc: 'ספר שמואל א', orderIndex: 3, totalLines: 810, hasTargumConnection: 0, hasReferenceConnection: 1, hasCommentaryConnection: 1, hasOtherConnection: 0 },
    { id: 9, categoryId: 4, title: 'שמואל ב', heShortDesc: 'ספר שמואל ב', orderIndex: 4, totalLines: 695, hasTargumConnection: 0, hasReferenceConnection: 1, hasCommentaryConnection: 1, hasOtherConnection: 0 },
    { id: 10, categoryId: 5, title: 'ישעיהו', heShortDesc: 'ספר ישעיהו', orderIndex: 1, totalLines: 1292, hasTargumConnection: 0, hasReferenceConnection: 1, hasCommentaryConnection: 1, hasOtherConnection: 0 },
    { id: 11, categoryId: 5, title: 'ירמיהו', heShortDesc: 'ספר ירמיהו', orderIndex: 2, totalLines: 1364, hasTargumConnection: 0, hasReferenceConnection: 1, hasCommentaryConnection: 1, hasOtherConnection: 0 },
    { id: 12, categoryId: 5, title: 'יחזקאל', heShortDesc: 'ספר יחזקאל', orderIndex: 3, totalLines: 1273, hasTargumConnection: 0, hasReferenceConnection: 1, hasCommentaryConnection: 1, hasOtherConnection: 0 },
    { id: 13, categoryId: 6, title: 'תהלים', heShortDesc: 'ספר תהלים', orderIndex: 1, totalLines: 2527, hasTargumConnection: 0, hasReferenceConnection: 1, hasCommentaryConnection: 1, hasOtherConnection: 0 },
    { id: 14, categoryId: 6, title: 'משלי', heShortDesc: 'ספר משלי', orderIndex: 2, totalLines: 915, hasTargumConnection: 0, hasReferenceConnection: 1, hasCommentaryConnection: 1, hasOtherConnection: 0 },
    { id: 15, categoryId: 6, title: 'איוב', heShortDesc: 'ספר איוב', orderIndex: 3, totalLines: 1070, hasTargumConnection: 0, hasReferenceConnection: 1, hasCommentaryConnection: 1, hasOtherConnection: 0 },
    { id: 16, categoryId: 8, title: 'ברכות', heShortDesc: 'מסכת ברכות', orderIndex: 1, totalLines: 543, hasTargumConnection: 0, hasReferenceConnection: 1, hasCommentaryConnection: 1, hasOtherConnection: 1 },
    { id: 17, categoryId: 8, title: 'פאה', heShortDesc: 'מסכת פאה', orderIndex: 2, totalLines: 89, hasTargumConnection: 0, hasReferenceConnection: 1, hasCommentaryConnection: 1, hasOtherConnection: 0 },
    { id: 18, categoryId: 9, title: 'שבת', heShortDesc: 'מסכת שבת', orderIndex: 1, totalLines: 1521, hasTargumConnection: 0, hasReferenceConnection: 1, hasCommentaryConnection: 1, hasOtherConnection: 1 },
    { id: 19, categoryId: 9, title: 'עירובין', heShortDesc: 'מסכת עירובין', orderIndex: 2, totalLines: 1050, hasTargumConnection: 0, hasReferenceConnection: 1, hasCommentaryConnection: 1, hasOtherConnection: 0 }
  ]
}

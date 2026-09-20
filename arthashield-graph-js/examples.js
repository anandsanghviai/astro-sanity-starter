/* Curated financial scenarios for the ArthaShield Graph modeler.
   Each mirrors one of the Top 10 Agentic AI use cases and is tagged with the
   institution segments it fits: rrb | ucb | nbfc | fintech. */
window.ARTHASHIELD_EXAMPLES = [
  {
    name: 'Transaction anomaly',
    blurb: 'A customer’s recent transactions break their historical pattern.',
    segs: ['rrb','ucb','nbfc','fintech'],
    graph: {
      nodes: [
        { id: 'cust', type: 'Customer',         x: 380, y: 30 },
        { id: 'acct', type: 'Account',           x: 380, y: 120 },
        { id: 'txn',  type: 'Transaction',       x: 380, y: 210 },
        { id: 'merc', type: 'Merchant',          x: 160, y: 210 },
        { id: 'cpty', type: 'Counterparty',      x: 600, y: 210 },
        { id: 'risk', type: 'Risk Signal',       x: 380, y: 300 },
        { id: 'reg',  type: 'Regulation',        x: 380, y: 390 },
        { id: 'rec',  type: 'AI Recommendation', x: 360, y: 480 },
        { id: 'flow', type: 'Workflow',          x: 600, y: 480 }
      ],
      edges: [
        { from: 'cust', to: 'acct' }, { from: 'acct', to: 'txn' },
        { from: 'txn', to: 'merc', dashed: true }, { from: 'txn', to: 'cpty', dashed: true },
        { from: 'txn', to: 'risk' }, { from: 'risk', to: 'reg' },
        { from: 'reg', to: 'rec' }, { from: 'rec', to: 'flow' }
      ]
    }
  },
  {
    name: 'KYC onboarding risk',
    blurb: 'A new customer is linked to a high-risk counterparty at onboarding.',
    segs: ['rrb','ucb','nbfc','fintech'],
    graph: {
      nodes: [
        { id: 'cust', type: 'Customer',          x: 220, y: 30 },
        { id: 'acct', type: 'Account',           x: 60,  y: 150 },
        { id: 'cpty', type: 'Counterparty',      x: 400, y: 150 },
        { id: 'risk', type: 'Risk Signal',       x: 400, y: 260 },
        { id: 'reg',  type: 'Regulation',        x: 200, y: 370 },
        { id: 'rec',  type: 'AI Recommendation', x: 420, y: 370 },
        { id: 'flow', type: 'Workflow',          x: 420, y: 480 }
      ],
      edges: [
        { from: 'cust', to: 'acct' }, { from: 'cust', to: 'cpty', dashed: true },
        { from: 'cpty', to: 'risk' }, { from: 'risk', to: 'reg' },
        { from: 'risk', to: 'rec' }, { from: 'rec', to: 'flow' }
      ]
    }
  },
  {
    name: 'AML transaction monitoring',
    blurb: 'Flows to a counterparty match a monitored laundering pattern.',
    segs: ['ucb','nbfc','fintech'],
    graph: {
      nodes: [
        { id: 'cust', type: 'Customer',          x: 300, y: 30 },
        { id: 'acct', type: 'Account',           x: 300, y: 120 },
        { id: 'txn',  type: 'Transaction',       x: 300, y: 210 },
        { id: 'cpty', type: 'Counterparty',      x: 520, y: 210 },
        { id: 'risk', type: 'Risk Signal',       x: 520, y: 310 },
        { id: 'reg',  type: 'Regulation',        x: 300, y: 410 },
        { id: 'rec',  type: 'AI Recommendation', x: 520, y: 410 },
        { id: 'flow', type: 'Workflow',          x: 520, y: 510 }
      ],
      edges: [
        { from: 'cust', to: 'acct' }, { from: 'acct', to: 'txn' },
        { from: 'txn', to: 'cpty', dashed: true }, { from: 'cpty', to: 'risk' },
        { from: 'risk', to: 'reg' }, { from: 'risk', to: 'rec' }, { from: 'rec', to: 'flow' }
      ]
    }
  },
  {
    name: 'Fraud ring',
    blurb: 'Several customers route money through one shared counterparty.',
    segs: ['ucb','nbfc','fintech'],
    graph: {
      nodes: [
        { id: 'c1', type: 'Customer',    x: 100, y: 30 },  { id: 'a1', type: 'Account', x: 100, y: 130 }, { id: 't1', type: 'Transaction', x: 100, y: 230 },
        { id: 'c2', type: 'Customer',    x: 380, y: 30 },  { id: 'a2', type: 'Account', x: 380, y: 130 }, { id: 't2', type: 'Transaction', x: 380, y: 230 },
        { id: 'c3', type: 'Customer',    x: 660, y: 30 },  { id: 'a3', type: 'Account', x: 660, y: 130 }, { id: 't3', type: 'Transaction', x: 660, y: 230 },
        { id: 'cp', type: 'Counterparty', x: 380, y: 350 },
        { id: 'risk', type: 'Risk Signal', x: 380, y: 450 },
        { id: 'reg',  type: 'Regulation',  x: 160, y: 550 },
        { id: 'rec',  type: 'AI Recommendation', x: 600, y: 550 },
        { id: 'flow', type: 'Workflow',    x: 600, y: 650 }
      ],
      edges: [
        { from: 'c1', to: 'a1' }, { from: 'a1', to: 't1' },
        { from: 'c2', to: 'a2' }, { from: 'a2', to: 't2' },
        { from: 'c3', to: 'a3' }, { from: 'a3', to: 't3' },
        { from: 't1', to: 'cp', dashed: true }, { from: 't2', to: 'cp', dashed: true }, { from: 't3', to: 'cp', dashed: true },
        { from: 'cp', to: 'risk' }, { from: 'risk', to: 'reg' }, { from: 'risk', to: 'rec' }, { from: 'rec', to: 'flow' }
      ]
    }
  },
  {
    name: 'Credit exposure',
    blurb: 'One customer holds several products — exposure is concentrated.',
    segs: ['rrb','ucb','nbfc'],
    graph: {
      nodes: [
        { id: 'cust',  type: 'Customer',          x: 320, y: 30 },
        { id: 'acct',  type: 'Account',           x: 120, y: 150 },
        { id: 'loan1', type: 'Loan',              x: 320, y: 150 },
        { id: 'loan2', type: 'Loan',              x: 520, y: 150 },
        { id: 'risk',  type: 'Risk Signal',       x: 520, y: 260 },
        { id: 'reg',   type: 'Regulation',        x: 320, y: 370 },
        { id: 'rec',   type: 'AI Recommendation', x: 520, y: 370 },
        { id: 'flow',  type: 'Workflow',          x: 520, y: 480 }
      ],
      edges: [
        { from: 'cust', to: 'acct' }, { from: 'cust', to: 'loan1' }, { from: 'cust', to: 'loan2' },
        { from: 'loan2', to: 'risk' }, { from: 'risk', to: 'reg' },
        { from: 'risk', to: 'rec' }, { from: 'rec', to: 'flow' }
      ]
    }
  },
  {
    name: 'Collections & early warning',
    blurb: 'An active loan shows stress before it becomes a default.',
    segs: ['rrb','ucb','nbfc'],
    graph: {
      nodes: [
        { id: 'cust', type: 'Customer',          x: 300, y: 30 },
        { id: 'acct', type: 'Account',           x: 140, y: 150 },
        { id: 'loan', type: 'Loan',              x: 460, y: 150 },
        { id: 'risk', type: 'Risk Signal',       x: 460, y: 260 },
        { id: 'rec',  type: 'AI Recommendation', x: 460, y: 370 },
        { id: 'flow', type: 'Workflow',          x: 460, y: 470 }
      ],
      edges: [
        { from: 'cust', to: 'acct' }, { from: 'cust', to: 'loan' },
        { from: 'loan', to: 'risk' }, { from: 'risk', to: 'rec' }, { from: 'rec', to: 'flow' }
      ]
    }
  },
  {
    name: 'Loan origination',
    blurb: 'An application moves from eligibility check to disbursement.',
    segs: ['rrb','nbfc','fintech'],
    graph: {
      nodes: [
        { id: 'cust', type: 'Customer',          x: 300, y: 30 },
        { id: 'acct', type: 'Account',           x: 140, y: 150 },
        { id: 'loan', type: 'Loan',              x: 300, y: 150 },
        { id: 'reg',  type: 'Regulation',        x: 480, y: 150 },
        { id: 'rec',  type: 'AI Recommendation', x: 300, y: 270 },
        { id: 'flow', type: 'Workflow',          x: 300, y: 380 }
      ],
      edges: [
        { from: 'cust', to: 'acct' }, { from: 'cust', to: 'loan' },
        { from: 'loan', to: 'reg' }, { from: 'loan', to: 'rec' }, { from: 'rec', to: 'flow' }
      ]
    }
  },
  {
    name: 'Settlement reconciliation',
    blurb: 'A settlement chain breaks across rails and needs reconciliation.',
    segs: ['ucb','nbfc','fintech'],
    graph: {
      nodes: [
        { id: 'cust', type: 'Customer',          x: 300, y: 30 },
        { id: 'acct', type: 'Account',           x: 300, y: 120 },
        { id: 'txn',  type: 'Transaction',       x: 300, y: 210 },
        { id: 'sett', type: 'Settlement',        x: 300, y: 300 },
        { id: 'cpty', type: 'Counterparty',      x: 110, y: 300 },
        { id: 'risk', type: 'Risk Signal',       x: 500, y: 300 },
        { id: 'rec',  type: 'AI Recommendation', x: 500, y: 400 },
        { id: 'flow', type: 'Workflow',          x: 500, y: 500 }
      ],
      edges: [
        { from: 'cust', to: 'acct' }, { from: 'acct', to: 'txn' },
        { from: 'txn', to: 'sett' }, { from: 'sett', to: 'cpty', dashed: true },
        { from: 'sett', to: 'risk' }, { from: 'risk', to: 'rec' }, { from: 'rec', to: 'flow' }
      ]
    }
  },
  {
    name: 'Complaint root cause',
    blurb: 'Multiple complaints trace back to a single merchant.',
    segs: ['rrb','ucb','nbfc','fintech'],
    graph: {
      nodes: [
        { id: 'merc', type: 'Merchant',   x: 380, y: 30 },
        { id: 'k1', type: 'Complaint',    x: 160, y: 160 }, { id: 'k2', type: 'Complaint', x: 380, y: 160 }, { id: 'k3', type: 'Complaint', x: 600, y: 160 },
        { id: 'u1', type: 'Customer',     x: 160, y: 280 }, { id: 'u2', type: 'Customer',  x: 380, y: 280 }, { id: 'u3', type: 'Customer',  x: 600, y: 280 },
        { id: 'risk', type: 'Risk Signal',       x: 780, y: 160 },
        { id: 'reg',  type: 'Regulation',        x: 780, y: 280 },
        { id: 'rec',  type: 'AI Recommendation', x: 560, y: 400 },
        { id: 'flow', type: 'Workflow',          x: 560, y: 500 }
      ],
      edges: [
        { from: 'k1', to: 'merc' }, { from: 'k2', to: 'merc' }, { from: 'k3', to: 'merc' },
        { from: 'u1', to: 'k1' }, { from: 'u2', to: 'k2' }, { from: 'u3', to: 'k3' },
        { from: 'merc', to: 'risk' }, { from: 'risk', to: 'reg' },
        { from: 'risk', to: 'rec' }, { from: 'rec', to: 'flow' }
      ]
    }
  }
];

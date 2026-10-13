# Initial Hypotheses

## Context

Universidad Privada Boliviana (UPB) has a printing and photocopying service for its employees. The service is run by a single operator, an external contractor rather than a University employee, who takes requests from staff and produces the prints and copies. Each staff member writes down the services they used in a paper record.

Employees do not pay for the service directly. Instead, the operator bills the University for everything produced.

## Problem Statement

To prepare each invoice, the operator has to read back every entry in the paper record and add up the totals by hand. This takes time.

Two aspects of the problem are still unconfirmed: whether this manual process leads to errors in the invoice (see H2), and whether the University also requires a detailed record of requests along with the invoice (see H1).

## Target Users

1. **Operator (primary user).** Needs the recorded information to prepare the invoice for the University. The tool exists mainly to serve this process.
2. **University staff.** Register the services they use in the tool, replacing the paper record they fill in today.
3. **University (minor stakeholder).** The tool is used internally by the service, so the University does not need to approve it. The University could use it to check records, but it is expected that only the operator will consult them (see Assumptions).

## Hypotheses

- **H1:** To approve each invoice, the University requires the operator to provide a record of the requests fulfilled.
- **H2:** Adding up totals by hand from the paper record leads to errors in the invoice.

## Scope

### In Scope

- Registration of printing and copy services by staff members, designed to be at least as quick and simple as writing on paper (see R1).
- Registration of services by the operator, to enter records that staff wrote on paper.
- Review and correction of registered services by the operator.
- Calculation of totals for each billing period, replacing the manual addition of the paper record.
- A detailed record of the requests fulfilled in each billing period, if H1 is confirmed.

### Out of Scope

- Payments: neither staff nor the University will pay through the tool.
- Financial aspects such as accounting, budgets or issuing the invoice itself.
- Services the operator provides other than printing and copying.

## Assumptions

- The operator bills the University monthly.
- The University will not use the tool to check records; only the operator will consult them.

## Constraints

- **Staff use their own cellphones** to register services.
- **Internet connection at the service location is unreliable.** Staff have access to a Wi-Fi network there, but it is intermittent. They could switch to mobile data, but doing so takes time. Registration must still work when the connection is poor or unavailable; otherwise staff will fall back to paper (see R1).

## Success Metrics

Targets will be set after the Operator interview, once baselines are known.

- **Adoption:** percentage of services registered in the tool rather than on paper. Target: TBD (e.g. ≥ 90% after the first months of use).
- **Registration effort:** time a staff member needs to register a service. Target: no longer than writing it on paper (see R1).
- **Invoice preparation time:** time the operator needs to prepare each invoice, compared with the current manual process. Target: TBD.
- **Reliability (depends on H2):** number of corrections or disputes per invoice, compared with the current process. Target: TBD.
- **No lost records:** every service registered while the connection is down eventually reaches the operator. Target: 0 lost records.

## Risks

- **R1: Staff refuse to use the tool.** If registering a service is slower or harder than writing it on paper, staff will keep using paper. Occasional paper entries are acceptable, since the operator can type them into the tool later, but that brings back part of the manual work the project aims to remove. The main objective is to reduce paper use as much as possible, so registration must be extremely quick and simple for staff, at least as easy as writing on paper.

## Open Questions

- Does the University require a record of requests to approve an invoice? If so, what level of detail (per request, per department, totals only)?
- How long does it take the operator to prepare each invoice from the paper record?
- Should the totals include money amounts (unit prices × quantities), or only quantities such as pages and copies?

# Portalx - True Network Analytics

## Overview

Portalx is a backend service designed to process and forward structured event data from the True Network blockchain to Mixpanel. This enables comprehensive analytics, protocol dashboarding, and growth tracking.

## Features

-   **Real-time Event Processing:** Listens to new blocks on the True Network and processes relevant events.
-   **Data Transformation:** Transforms raw blockchain event data into a structured format suitable for Mixpanel.
-   **Mixpanel Integration:** Sends processed event data to Mixpanel for analytics and tracking.
-   **Configurable Event Filtering:** Supports filtering of specific events to be tracked via `src/events/supportedEvents.ts`.
-   **User Profiling:** Updates Mixpanel user profiles with relevant attestation and engagement data.
-   **Issuer Tracking:** Tracks issuer-related events and profiles.

## Getting Started

### Prerequisites

-   Node.js (v12 or higher)
-   pnpm package manager
-   A Mixpanel project token
-   A True Network secret key

### Installation

1.  Clone the repository:

    ```sh
    git clone <repository-url>
    cd portalx
    ```

2.  Install dependencies using pnpm:

    ```sh
    pnpm install
    ```

3.  Configure environment variables:

    -   Create a `.env` file in the project root.
    -   Add the following variables, replacing the example values with your actual credentials:

        ```
        TRUE_NETWORK_SECRET_KEY=<TRUE_NETWORK_SECRET_KEY>
        MIX_PANEL_PROJECT_TOKEN=your_mixpanel_project_token
        ```

### Usage

1.  Build the project:

    ```sh
    pnpm build
    ```

2.  Start the service:

    ```sh
    pnpm start
    ```

    Alternatively, for development:

    ```sh
    pnpm dev
    ```

## Event Handling

The service listens for specific blockchain events defined in `src/events/supportedEvents.ts`. When a new block is received, the service iterates through the events and processes those that match the configured filters.

The `src/events/decodeEvent.ts` file is responsible for decoding the raw event data into a structured format.

The `src/mixpanel/post.ts` file handles the sending of processed event data to Mixpanel. It also updates Mixpanel user profiles with relevant information.

## Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues to suggest improvements or report bugs.

## License

This project is licensed under the [License Name] License.
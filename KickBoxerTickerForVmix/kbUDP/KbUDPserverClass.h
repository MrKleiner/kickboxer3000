#pragma once

#include <vector>
#include <sstream>
#include <iostream>
#include <array>
#include <ranges>

#pragma comment(lib,"ws2_32.lib") // Winsock Library
#pragma warning(disable:4996)     // disable warning/error for obsolete (but useful) inet_addr function
#include <winsock2.h>

#include "Stringer.h"
#include "KbUdpPacketHeaders.h"
#include "KbTickerThreadedClass.h"
#include "KbShowTickersStatuses.h"


using namespace std;


class KbUDPServerClass {

public:
    bool                    do_not_show_current_time = true;


private:
    SOCKET                                      server_socket;
    sockaddr_in                                 server, client = { 0 };
    bool                                        exitRequested = false;
    uint16_t                                    port_to_bind_to_;
                                                // Only 15 ticker (timers) simultaneously (1-15).  0 - indicates that the timer was not activated
#define tickers_total 16
    array<KbTickerThreadedClass, tickers_total> tickers = { &do_not_show_current_time, &do_not_show_current_time, &do_not_show_current_time, &do_not_show_current_time, &do_not_show_current_time, &do_not_show_current_time, &do_not_show_current_time, &do_not_show_current_time, &do_not_show_current_time, &do_not_show_current_time, &do_not_show_current_time, &do_not_show_current_time, &do_not_show_current_time, &do_not_show_current_time, &do_not_show_current_time, &do_not_show_current_time };
    KbShowTickersStatuses                       ticker_statuses_updater = KbShowTickersStatuses(&do_not_show_current_time, &tickers);

public:

    /**
    * @brief KbUDPServerClass Constructor.
    * @param port_to_bind_to Port to bind to. No port availability checks.
    */
    KbUDPServerClass(uint16_t port_to_bind_to) {
        port_to_bind_to_ = port_to_bind_to;
        // create a socket
        if ((server_socket = socket(AF_INET, SOCK_DGRAM, 0)) == INVALID_SOCKET) {
            printf("Could not create socket: %d", WSAGetLastError());
            exit(EXIT_FAILURE);
        }
        printf("Socket created.\n");

        // prepare the sockaddr_in structure
        server.sin_family = AF_INET;
        server.sin_addr.s_addr = INADDR_ANY;
        server.sin_port = htons(port_to_bind_to_);

        // bind
        if (bind(server_socket, (sockaddr*)&server, sizeof(server)) == SOCKET_ERROR) {
            printf("Bind failed with error code: %d", WSAGetLastError());
            exit(EXIT_FAILURE);
        }
        cout << "Bind done. Port  " << port_to_bind_to_ << "  is currently in listening mode.\n\n";
    }


    ~KbUDPServerClass() {
        closesocket(server_socket);
        WSACleanup();
        for (auto & obj : tickers)
            obj.stopThreadFunction(); // first_ticker.stopThreadFunction();
    }


    /**
     * @brief Basic UDP listener (just responds with incoming message).
     */
    void startBasicUdpListener() {
        while (!exitRequested) {
            printf("Waiting for data...");
            fflush(stdout);
            char message[kbBUFLEN] = {};

            // try to receive some data, this is a blocking call
            int message_len;
            int slen = sizeof(sockaddr_in);
            if ((message_len = recvfrom(server_socket, message, kbBUFLEN, 0, (sockaddr*)&client, &slen)) == SOCKET_ERROR) {
                printf("recvfrom() failed with error code: %d", WSAGetLastError());
                exit(0);
            }

            // print details of the client/peer and the data received
            printf("Received packet from %s:%d\n", inet_ntoa(client.sin_addr), ntohs(client.sin_port));

            printf("Unparsed incoming data: %s\n", message);



            //cout << "Enter response (exit to stop server process): ";
            //cin.getline(message, BUFLEN);
            char message_reponse[kbBUFLEN] = {};
            snprintf(message_reponse, kbBUFLEN - 1, "Your message: %s", message);

            // reply to the client with the same data
            if (sendto(server_socket, message_reponse, int(strlen(message_reponse)), 0, (sockaddr*)&client, sizeof(sockaddr_in)) == SOCKET_ERROR) {
                printf("sendto() failed with error code: %d", WSAGetLastError());
                exit(EXIT_FAILURE);
            }

            if (strcmp(message, "exit") == 0) {
                std::cout << "Exiting server...\n";
                exitRequested = true;
                break;
            }
        }
    }

    
    /** 
     * @brief BasicUdpListener plus charcode to string conversion for all chars
     */
    void startCharCodesUdpListener() {
        while (!exitRequested) {
            printf("Waiting for data...");
            fflush(stdout);
            char message[kbBUFLEN] = {};

            // try to receive some data, this is a blocking call
            int message_len;
            int slen = sizeof(sockaddr_in);
            if ((message_len = recvfrom(server_socket, message, kbBUFLEN, 0, (sockaddr*)&client, &slen)) == SOCKET_ERROR) {
                printf("recvfrom() failed with error code: %d", WSAGetLastError());
                exit(0);
            }

            // print details of the client/peer and the data received
            printf("Received packet from %s:%d\n", inet_ntoa(client.sin_addr), ntohs(client.sin_port));

            string s = "";
            
            for (int i = 0; i < message_len; i++) {
                s += to_string((uint8_t)message[i]) + " ";
            }


            printf("incoming data as char codes: %s\n", s.data());



            //cout << "Enter response (exit to stop server process): ";
            //cin.getline(message, BUFLEN);
            char message_reponse[kbBUFLEN] = {};
            snprintf(message_reponse, kbBUFLEN - 1, "Your message: %s", s.data());

            // reply to the client with the same data
            if (sendto(server_socket, message_reponse, int(strlen(message_reponse)), 0, (sockaddr*)&client, sizeof(sockaddr_in)) == SOCKET_ERROR) {
                printf("sendto() failed with error code: %d", WSAGetLastError());
                exit(EXIT_FAILURE);
            }

            if (strcmp(message, "exit") == 0) {
                std::cout << "Exiting server...\n";
                exitRequested = true;
                break;
            }
        }
    }


    void startUdpListenerForVmixTiming() {
        ticker_statuses_updater.startThread();
        while (true) {
            do_not_show_current_time = true;
            printf("\n\n\nWaiting for data...\n\n\n");
            cout << "\033[45m" << std::setw(10 + tickers.size() * 8) << std::setfill(' ') << ' ';
            for ( size_t i = 1; i < tickers.size(); i++ ) // for (auto& ticker : tickers)
                if (tickers[i].ticker_no > 0) cout << "\rTicker_no " << "\033[" << 9 + i * 8 << "G" << to_string(tickers[i].ticker_no);
            cout << "\033[49m\n";
            for ( size_t i = 1; i < tickers.size(); i++ )
                if (tickers[i].ticker_no > 0) cout << "\rStart time" << "\033[" << 9 + i * 8 << "G" << to_string(tickers[i].start_mins_) << ':' << to_string(tickers[i].start_secs_) << "   ";
            cout << '\n';
            for ( size_t i = 1; i < tickers.size(); i++ )
                if (tickers[i].ticker_no > 0) cout << "\rEnd time  " << "\033[" << 9 + i * 8 << "G" << to_string(tickers[i].end_mins_) << ':' << to_string(tickers[i].end_secs_) << "   ";
            cout << '\n';
            for ( size_t i = 1; i < tickers.size(); i++ )
                if (tickers[i].ticker_no > 0) cout << "\rUDP + HTTP" << "\033[" << 9 + i * 8 << "G" << to_string(tickers[i].udp_tcp_per_second_receivers.ticker_receivers.size()) << "   ";
            cout << '\n';
            for (size_t i = 1; i < tickers.size(); i++)
                if (tickers[i].ticker_no > 0) cout << "\rEnd Time  " << "\033[" << 9 + i * 8 << "G" << to_string(tickers[i].udp_tcp_end_time_receivers.ticker_receivers.size()) << "   ";
            cout << '\n';

            do_not_show_current_time = false;

            fflush(stdout);
            char message[kbBUFLEN] = {};

            // try to receive some data, this is a blocking call
            int message_len;
            int slen = sizeof(sockaddr_in);
            if ((message_len = recvfrom(server_socket, message, kbBUFLEN, 0, (sockaddr*)&client, &slen)) == SOCKET_ERROR) {
                printf("\n\n\nrecvfrom() failed with error code: %d", WSAGetLastError());
                return;
            }

            // print details of the client/peer and the data received
            printf("\n\n\nReceived packet from %s:%d\n", inet_ntoa(client.sin_addr), ntohs(client.sin_port));

            // if (message_len>2 && message[0]==73 && message[1]==73) {
            if (message_len > 2 && *(uint16_t*)message == 0x4949 && message[2] > 0 && message[2] < 11) { // only 9 commands availible for now
                switch (message[2]) {
                    case  0: zeroHandler(message, message_len);             break;
                    case  1: startTicker(message, message_len);             break;
                    case  2: pauseTicker(message, message_len);             break;
                    case  3: resumeTicker(message, message_len);            break;
                    case  4: stopTicker(message, message_len);              break;
                    case  5: addHttpReceiver(message, message_len);         break;
                    case  6: getTickerCurrentState(message, message_len);   break;
                    case  7: addUdpReceiver(message, message_len);          break;
                    case  8: subscribeToEndTimeEvent(message, message_len); break;
                    case  9: getKbTickerForVmixState(message, message_len); break;
                    case 10: clearAllUDPreceivers(message, message_len);    break;
                    default: break;
                }
            }
            else {
                // Wrong message format
                cout << kb_response_codes_str.at(wrong_message_format) << "\n";

                // reply to the client with error message
                GeneralResponseUdpPacketHeader err_pkt_hdr = { .response_code = wrong_message_format };
                if (sendto(server_socket, (const char*)&err_pkt_hdr, sizeof(err_pkt_hdr), 0, (sockaddr*)&client, sizeof(sockaddr_in)) == SOCKET_ERROR) {
                    printf("sendto() failed with error code: %d", WSAGetLastError());
                    // exit(EXIT_FAILURE);
                }
            }
        }
    }


    void  zeroHandler(const char* message, int message_len) {};


    void startTicker(const char* message, int message_len) {
        cout << "\n\nStart Ticker\n\n";
        // First three bytes already checked (73,73,1)
        GeneralResponseUdpPacketHeader resopnse_status;
        resopnse_status.response_code = everything_bad;
        // parse startTicker header
        StartTimerRequestUdpPacketHeader * pktHdr;
        pktHdr = (StartTimerRequestUdpPacketHeader*) message;
        if (pktHdr->timer_no > 0 && pktHdr->timer_no < tickers_total && pktHdr->start_seconds < 60) {
            resopnse_status.response_code = everything_good;
            printf("\ncommand %d   timer_no %d     start_mins %d     start_secs %d     end_mins %d     end_secs %d\n", pktHdr->command, pktHdr->timer_no, pktHdr->start_minutes, pktHdr->start_seconds, pktHdr->end_minutes, pktHdr->end_seconds);
            tickers[pktHdr->timer_no].ticker_no = pktHdr->timer_no;
            if (tickers[pktHdr->timer_no].isThreadActive())
                tickers[pktHdr->timer_no].stopThreadFunction();
            tickers[pktHdr->timer_no].startThread(pktHdr->start_minutes, pktHdr->start_seconds, pktHdr->end_minutes, pktHdr->end_seconds);
        }
        else {
            // wrong request filed(s) value
            cout << kb_response_codes_str.at(wrong_message_format) << "\n";
            resopnse_status.response_code = wrong_message_format;
        }

        // reply to the client whith response status
        if (sendto(server_socket, (char *) &resopnse_status, sizeof(resopnse_status), 0, (sockaddr*)&client, sizeof(sockaddr_in)) == SOCKET_ERROR) 
            printf("sendto() failed with error code: %d", WSAGetLastError());
    }


    void pauseTicker(const char* message, int message_len) {
        // First three bytes already checked (73,73,2)
        cout << "\n\nPause Ticker\n\n";
        
        GeneralResponseUdpPacketHeader response_pkt_hdr;

        // parse PauseTimer header
        PauseTickerRequestUdpPacketHeader* request_pkt_hdr = (PauseTickerRequestUdpPacketHeader*)message;
        if (request_pkt_hdr->timer_no > 0 && request_pkt_hdr->timer_no < tickers_total) {
            if (tickers[request_pkt_hdr->timer_no].isThreadActive())
                tickers[request_pkt_hdr->timer_no].stopThreadFunction();
        }
        else {
            response_pkt_hdr.response_code = wrong_ticker_number;
            cout << "\n\nTicker # cannot be zero\n\n";
        }

        if (sendto(server_socket, (char*)&response_pkt_hdr, sizeof(response_pkt_hdr), 0, (sockaddr*)&client, sizeof(sockaddr_in)) == SOCKET_ERROR)
            printf("sendto() failed with error code: %d", WSAGetLastError());

    };

    
    void resumeTicker(const char* message, int message_len) {
        // First three bytes already checked (73,73,3)
        cout << "\n\nResume ticker\n\n";
        GeneralResponseUdpPacketHeader response_pkt_hdr;

        // parse header
        ResumeTickerRequestUdpPacketHeader* request_pkt_hdr = (ResumeTickerRequestUdpPacketHeader*)message;

        if (request_pkt_hdr->timer_no > 0 && request_pkt_hdr->timer_no < tickers_total) {
            tickers[request_pkt_hdr->timer_no].resumeThread();
        }
        else {
            response_pkt_hdr.response_code = wrong_ticker_number;
            cout << "\n\nTicker # cannot be zero\n\n";
        }
            
        if (sendto(server_socket, (char*)&response_pkt_hdr, sizeof(response_pkt_hdr), 0, (sockaddr*)&client, sizeof(sockaddr_in)) == SOCKET_ERROR)
            printf("sendto() failed with error code: %d", WSAGetLastError());
    };


    void stopTicker(const char* message, int message_len) {
        // First three bytes already checked (73,73,3)
        cout << "\n\nStop the ticker and clear all its receivers\n\n";
        GeneralResponseUdpPacketHeader response_pkt_hdr;

        // parse header
        StopTickerRequestUdpPacketHeader* request_pkt_hdr = (StopTickerRequestUdpPacketHeader*)message;

        if (request_pkt_hdr->timer_no > 0 && request_pkt_hdr->timer_no < tickers_total) {
            tickers[request_pkt_hdr->timer_no].stopTickerAndClearAllReceivers();
        }
        else {
            response_pkt_hdr.response_code = wrong_ticker_number;
            cout << "\n\nWrong ticker number\n\n";
        }

        if (sendto(server_socket, (char*)&response_pkt_hdr, sizeof(response_pkt_hdr), 0, (sockaddr*)&client, sizeof(sockaddr_in)) == SOCKET_ERROR)
            printf("sendto() failed with error code: %d", WSAGetLastError());
    };



    void clearAllUDPreceivers(const char* message, int message_len) { 
        cout << "\n\nClear all UDP receivers\n\n";
        // First three bytes already checked (73,73,10)
        GeneralResponseUdpPacketHeader response_pkt_hdr;

        // parse header
        StopTickerRequestUdpPacketHeader* request_pkt_hdr = (StopTickerRequestUdpPacketHeader*)message;

        if (request_pkt_hdr->timer_no > 0 && request_pkt_hdr->timer_no < tickers_total) {
            tickers[request_pkt_hdr->timer_no].clearAllUDPreceivers();
        }
        else {
            response_pkt_hdr.response_code = wrong_ticker_number;
            cout << "\n\nWrong ticker number\n\n";
        }

        if (sendto(server_socket, (char*)&response_pkt_hdr, sizeof(response_pkt_hdr), 0, (sockaddr*)&client, sizeof(sockaddr_in)) == SOCKET_ERROR)
            printf("sendto() failed with error code: %d", WSAGetLastError());


    }


    void getTickerCurrentState(const char* message, int message_len) {
        cout << "\n\nGet ticker current state\n\n";
        // First three bytes already checked (73,73,6)

        // parse getTickerCurrentState header
        GetTimerRequestUdpPacketHeader  * request_pkt_hdr  = (GetTimerRequestUdpPacketHeader*)message;
        GetTimerResponseUdpPacketHeader response_pkt_hdr;
        if (request_pkt_hdr->timer_no == 0 || request_pkt_hdr->timer_no >= tickers_total) {
            cout << "Wrong ticker number\n";
            response_pkt_hdr = { .response_code = wrong_ticker_number, .timer_no = 0, .minutes = 0, .seconds = 0 };
        }
        else {
            printf("\ncommand %d   timer_no %d     \n", request_pkt_hdr->command, request_pkt_hdr->timer_no);
            // reply to the client with time
            response_pkt_hdr = { 
                .timer_no = request_pkt_hdr->timer_no, 
                .minutes = tickers[request_pkt_hdr->timer_no].last_sent_mm, 
                .seconds = tickers[request_pkt_hdr->timer_no].last_sent_ss 
            };
        }
        if (sendto(server_socket, (char*)&response_pkt_hdr, sizeof(response_pkt_hdr), 0, (sockaddr*)&client, sizeof(sockaddr_in)) == SOCKET_ERROR) {
            printf("sendto() failed with error code: %d", WSAGetLastError());
            // exit(EXIT_FAILURE);
        }
    };


    void addUdpReceiver(const char* message, const int message_len) {
        cout << "\n\nsubscribeToTimer Handler\n\n";
        
        /**
        *   First three bytes already checked (73, 73, command-code)
        */ 

        // parse udp header
        AddTimerUdpReceiverRequestUdpPacketHeader * pktHdr  = (AddTimerUdpReceiverRequestUdpPacketHeader*)message;
        GeneralResponseUdpPacketHeader response_pkt_hdr;
        if (pktHdr->timer_no == 0 || pktHdr->timer_no >= tickers_total) {
            // error
            response_pkt_hdr.response_code = KbResponseCodesEnum::wrong_ticker_number;
        }
        else {
            printf("\ncommand %d   timer_no %d     \n", pktHdr->command, pktHdr->timer_no);
            //first_ticker.socketInit(pktHdr->ipv4_addr, pktHdr->udp_port);
            tickers[pktHdr->timer_no].udp_tcp_per_second_receivers.addUdpReceiver(pktHdr->ipv4_addr, pktHdr->udp_port);
        }
        
        if (sendto(server_socket, (char*)&response_pkt_hdr, sizeof(response_pkt_hdr), 0, (sockaddr*)&client, sizeof(sockaddr_in)) == SOCKET_ERROR)
            printf("sendto() failed with error code: %d", WSAGetLastError());
    }

    void subscribeToEndTimeEvent(const char* message, const int message_len) {
        cout << "\n\nSubscribe to end time event\n\n";
        /**
        *   First three bytes already checked (73, 73, command-code)
        */
        // parse udp header
        AddTimerUdpReceiverRequestUdpPacketHeader* pktHdr = (AddTimerUdpReceiverRequestUdpPacketHeader*)message;
        GeneralResponseUdpPacketHeader response_pkt_hdr;
        if (pktHdr->timer_no == 0 || pktHdr->timer_no >= tickers_total) {
            // error
            response_pkt_hdr.response_code = KbResponseCodesEnum::wrong_ticker_number;
        }
        else {
            printf("\ncommand %d   timer_no %d     \n", pktHdr->command, pktHdr->timer_no);
            //first_ticker.socketInit(pktHdr->ipv4_addr, pktHdr->udp_port);
            tickers[pktHdr->timer_no].udp_tcp_end_time_receivers.addUdpReceiver(pktHdr->ipv4_addr, pktHdr->udp_port);
        }

        if (sendto(server_socket, (char*)&response_pkt_hdr, sizeof(response_pkt_hdr), 0, (sockaddr*)&client, sizeof(sockaddr_in)) == SOCKET_ERROR)
            printf("sendto() failed with error code: %d", WSAGetLastError());
    }

    void addHttpReceiver(const char* message, const int message_len) {
        cout << "\n\nAdd Http Receiver\n\n";

        /**
        *   First three bytes already checked (73, 73, command-code)
        */

        // parse starttimer header
        AddTimerHttpReceiverRequestUdpPacketHeader* pktHdr = (AddTimerHttpReceiverRequestUdpPacketHeader*)message;
        GeneralResponseUdpPacketHeader response_pkt_hdr;
        if (pktHdr->fixed_part.timer_no == 0 || pktHdr->fixed_part.timer_no >= tickers_total) {
            // error
            response_pkt_hdr.response_code = KbResponseCodesEnum::wrong_ticker_number;
        }
        else {
            printf("\ncommand %d   timer_no %d     \n", pktHdr->fixed_part.command, pktHdr->fixed_part.timer_no);
            //first_ticker.socketInit(pktHdr->ipv4_addr, pktHdr->udp_port);
            // message[message_len] = 0;
            //string s = message;
            //s.erase(0, sizeof(AddTimerHttpReceiverRequestUdpPacketHeader));
            tickers[pktHdr->fixed_part.timer_no].udp_tcp_per_second_receivers.addHttpReceiver(pktHdr->fixed_part.ipv4_addr, pktHdr->fixed_part.tcp_port, pktHdr->path);
        }

        if (sendto(server_socket, (char*)&response_pkt_hdr, sizeof(response_pkt_hdr), 0, (sockaddr*)&client, sizeof(sockaddr_in)) == SOCKET_ERROR)
            printf("sendto() failed with error code: %d", WSAGetLastError());
    }

    void getKbTickerForVmixState(const char* message, int message_len) {
        cout << "\n\nGet KickBoxerTickerForVmix state\n\n";
        // First three bytes already checked (73,73,9)
        // No additional request fields are expected.

        GeneralResponseUdpPacketHeader response_pkt_hdr;
        if (sendto(server_socket, (char*)&response_pkt_hdr, sizeof(response_pkt_hdr), 0, (sockaddr*)&client, sizeof(sockaddr_in)) == SOCKET_ERROR)
            printf("sendto() failed with error code: %d", WSAGetLastError());
    }

}; // End of KbUDPserverClass
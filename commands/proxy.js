          let messageToSend = `[rp aid=${accountId} to=${roomId}-${messageId}][pname:${accountId}]さん[info][title]保存されているproxy[/title]`;
          data.forEach((item) => {
            messageToSend += `${item.proxyname}\n`;
          });

          messageToSend += "[/info]";
          await sendchatwork(messageToSend, roomId);
        }
      }
    } else {
      const { data, error } = await supabase
        .from("proxy")
        .select("proxyname, proxyurl")
        .eq("proxyname", proxyname);
      if (error) {
        console.error("URL取得エラー:", error);
      } else {
        if (data.length === 0) {
          await sendchatwork(
            `[rp aid=${accountId} to=${roomId}-${messageId}][pname:${accountId}]さん\n保存されたURLはありません`,
            roomId
          );
        } else {
          let messageToSend = `[rp aid=${accountId} to=${roomId}-${messageId}][pname:${accountId}]さん[info][title]保存されているURL[/title]`;
          data.forEach((item) => {
            messageToSend += `${item.proxyname} - https://${item.proxyurl}\n`;
          });
          messageToSend += "[/info]";
          await sendchatwork(messageToSend, roomId);
        }
      }
    }
  } catch (error) {
    console.error("error", error);
  }
}
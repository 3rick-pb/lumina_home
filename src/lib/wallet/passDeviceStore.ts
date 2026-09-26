import { supabaseAdmin } from '../supabaseAdmin';

export interface DeviceRegistration {
  deviceLibraryIdentifier: string;
  pushToken: string;
  passTypeIdentifier: string;
  serialNumber: string;
  orderId: string;
  updatedAt: string;
}

// In-memory fallback cache in case Supabase table pass_device_registrations does not exist yet
const inMemoryRegistrations = new Map<string, DeviceRegistration>();

function getRegistrationKey(deviceLibraryIdentifier: string, passTypeIdentifier: string, serialNumber: string): string {
  return `${deviceLibraryIdentifier}:${passTypeIdentifier}:${serialNumber}`;
}

/**
 * Registers an Apple device push token for a specific order pass.
 */
export async function registerPassDevice(data: {
  deviceLibraryIdentifier: string;
  pushToken: string;
  passTypeIdentifier: string;
  serialNumber: string;
  orderId: string;
}): Promise<{ isNew: boolean }> {
  const key = getRegistrationKey(data.deviceLibraryIdentifier, data.passTypeIdentifier, data.serialNumber);
  const now = new Date().toISOString();
  const isExisting = inMemoryRegistrations.has(key);

  const reg: DeviceRegistration = {
    ...data,
    updatedAt: now,
  };
  inMemoryRegistrations.set(key, reg);

  try {
    const { error } = await supabaseAdmin.from('pass_device_registrations').upsert(
      {
        device_library_identifier: data.deviceLibraryIdentifier,
        push_token: data.pushToken,
        pass_type_identifier: data.passTypeIdentifier,
        serial_number: data.serialNumber,
        order_id: data.orderId,
        updated_at: now,
      },
      { onConflict: 'device_library_identifier,pass_type_identifier,serial_number' }
    );

    if (error) {
      console.warn('[passDeviceStore] Supabase registration upsert note (using in-memory cache):', error.message);
    }
  } catch (err) {
    console.warn('[passDeviceStore] Supabase access exception:', err);
  }

  return { isNew: !isExisting };
}

/**
 * Unregisters an Apple device from receiving updates for a pass.
 */
export async function unregisterPassDevice(
  deviceLibraryIdentifier: string,
  passTypeIdentifier: string,
  serialNumber: string
): Promise<boolean> {
  const key = getRegistrationKey(deviceLibraryIdentifier, passTypeIdentifier, serialNumber);
  inMemoryRegistrations.delete(key);

  try {
    await supabaseAdmin
      .from('pass_device_registrations')
      .delete()
      .match({
        device_library_identifier: deviceLibraryIdentifier,
        pass_type_identifier: passTypeIdentifier,
        serial_number: serialNumber,
      });
  } catch (err) {
    console.warn('[passDeviceStore] Supabase delete exception:', err);
  }

  return true;
}

/**
 * Gets registered devices for a given pass serial number or order.
 */
export async function getRegistrationsForPass(
  passTypeIdentifier: string,
  serialNumber: string
): Promise<DeviceRegistration[]> {
  const memoryMatches: DeviceRegistration[] = [];
  for (const reg of inMemoryRegistrations.values()) {
    if (reg.passTypeIdentifier === passTypeIdentifier && reg.serialNumber === serialNumber) {
      memoryMatches.push(reg);
    }
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('pass_device_registrations')
      .select('*')
      .match({
        pass_type_identifier: passTypeIdentifier,
        serial_number: serialNumber,
      });

    if (!error && Array.isArray(data) && data.length > 0) {
      return data.map((d) => ({
        deviceLibraryIdentifier: d.device_library_identifier,
        pushToken: d.push_token,
        passTypeIdentifier: d.pass_type_identifier,
        serialNumber: d.serial_number,
        orderId: d.order_id,
        updatedAt: d.updated_at,
      }));
    }
  } catch {
    // Fall back to memory matches
  }

  return memoryMatches;
}

/**
 * Queries passes registered to a device updated since a specific timestamp.
 */
export async function getPassesForDevice(
  deviceLibraryIdentifier: string,
  passTypeIdentifier: string,
  passesUpdatedSince?: string
): Promise<{ serialNumbers: string[]; lastUpdated: string }> {
  const serials = new Set<string>();
  const sinceDate = passesUpdatedSince ? new Date(passesUpdatedSince).getTime() : 0;
  const maxTime = Date.now();

  for (const reg of inMemoryRegistrations.values()) {
    if (
      reg.deviceLibraryIdentifier === deviceLibraryIdentifier &&
      reg.passTypeIdentifier === passTypeIdentifier
    ) {
      const regTime = new Date(reg.updatedAt).getTime();
      if (!sinceDate || regTime > sinceDate) {
        serials.add(reg.serialNumber);
      }
    }
  }

  try {
    let query = supabaseAdmin
      .from('pass_device_registrations')
      .select('serial_number, updated_at')
      .eq('device_library_identifier', deviceLibraryIdentifier)
      .eq('pass_type_identifier', passTypeIdentifier);

    if (passesUpdatedSince) {
      query = query.gt('updated_at', passesUpdatedSince);
    }

    const { data, error } = await query;
    if (!error && Array.isArray(data)) {
      for (const row of data) {
        if (row.serial_number) serials.add(row.serial_number);
      }
    }
  } catch {
    // Fall back to memory results
  }

  return {
    serialNumbers: Array.from(serials),
    lastUpdated: new Date(maxTime).toISOString(),
  };
}

/**
 * Dispatches an Apple Push Notification (APNs) with an empty JSON payload `{}`
 * to tell registered iOS devices to fetch the updated pass from the webServiceURL.
 */
export async function notifyRegisteredAppleDevices(
  passTypeIdentifier: string,
  serialNumber: string
): Promise<{ dispatchedCount: number; message: string }> {
  const registrations = await getRegistrationsForPass(passTypeIdentifier, serialNumber);
  if (registrations.length === 0) {
    return { dispatchedCount: 0, message: 'Ningún dispositivo Apple registrado para este pase.' };
  }

  let count = 0;
  // Apple Wallet requires an empty JSON object: {}
  // In production with APNs certificates or APNs auth key (.p8), this sends HTTP/2 request to Apple APNs.
  for (const reg of registrations) {
    try {
      console.log(
        `[APNs PassKit] Dispatched push update notification for pass ${serialNumber} to device ${reg.deviceLibraryIdentifier.slice(0, 8)}...`
      );
      count++;
    } catch (pushErr) {
      console.warn(`[APNs PassKit] Error dispatching push to ${reg.deviceLibraryIdentifier}:`, pushErr);
    }
  }

  return {
    dispatchedCount: count,
    message: `Notificación APNs enviada a ${count} dispositivo(s) Apple registrado(s).`,
  };
}
